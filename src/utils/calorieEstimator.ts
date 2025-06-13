import { CalorieEstimate } from '../types';
import { callPerplexityAPI } from './perplexityApi';
import { supabase } from '../lib/supabase';

interface FoodKeyword {
  keywords: string[];
  baseCalories: number;
  category: string;
}

interface RestaurantDiscoveryResult {
  restaurant: string;
  menuItem: string;
  description: string;
  found: boolean;
  rawResponse: string;
  estimatedCalories: string;
  error?: string;
  suggestion?: string;
  inputFormat?: boolean;
  
  // Phase 2: Dish Analysis - Updated fields
  ingredientSource?: string;
  foundIngredients?: string;
  addedComponents?: string;
  completeIngredients?: string;
  standardCalories?: string;
  confidence?: string;
  rawResponses?: {
    phase1: string;
    phase2: string;
    phase3?: string;
  };
  phase?: number;
  ready?: string;
  
  // Phase 3: User Modifications
  modificationsDetected?: string;
  calorieAdjustments?: string;
  calculation?: string;
  finalCalories?: number;
  originalInput?: string;
  timestamp?: string;
  saved?: boolean;
  saveError?: string;
}

const foodDatabase: FoodKeyword[] = [
  // Proteins
  { keywords: ['burger', 'cheeseburger', 'hamburger'], baseCalories: 540, category: 'burger' },
  { keywords: ['chicken breast', 'grilled chicken'], baseCalories: 165, category: 'lean protein' },
  { keywords: ['fried chicken', 'chicken wings'], baseCalories: 320, category: 'fried protein' },
  { keywords: ['salmon', 'fish', 'tuna'], baseCalories: 206, category: 'fish' },
  { keywords: ['steak', 'beef', 'ribeye'], baseCalories: 271, category: 'red meat' },
  
  // Carbs
  { keywords: ['pasta', 'spaghetti', 'fettuccine'], baseCalories: 220, category: 'pasta' },
  { keywords: ['pizza'], baseCalories: 285, category: 'pizza slice' },
  { keywords: ['rice', 'fried rice'], baseCalories: 130, category: 'rice' },
  { keywords: ['bread', 'toast', 'bun'], baseCalories: 80, category: 'bread' },
  { keywords: ['fries', 'french fries'], baseCalories: 365, category: 'fried sides' },
  
  // Salads & Vegetables
  { keywords: ['salad', 'caesar salad'], baseCalories: 180, category: 'salad' },
  { keywords: ['vegetables', 'veggies', 'broccoli'], baseCalories: 55, category: 'vegetables' },
  
  // Desserts
  { keywords: ['cake', 'chocolate cake'], baseCalories: 352, category: 'dessert' },
  { keywords: ['ice cream'], baseCalories: 137, category: 'dessert' },
  
  // Beverages
  { keywords: ['soda', 'coke', 'pepsi'], baseCalories: 140, category: 'sugary drink' },
  { keywords: ['beer'], baseCalories: 150, category: 'alcoholic drink' },
  { keywords: ['wine'], baseCalories: 125, category: 'alcoholic drink' },
];

const portionModifiers = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
  extra: 1.8,
  double: 2.0,
};

const preparationModifiers = {
  fried: 1.5,
  grilled: 0.9,
  baked: 0.95,
  steamed: 0.8,
  'with sauce': 1.2,
  'with cheese': 1.3,
  'with butter': 1.4,
};

function parseRestaurantInfo(response: string) {
  // Extract restaurant name, menu item, description, and ingredient source from restaurant discovery
  const restaurantMatch = response.match(/RESTAURANT: (.+)/);
  const menuItemMatch = response.match(/MENU ITEM: (.+)/);
  const descriptionMatch = response.match(/MENU DESCRIPTION: (.+)/);
  const ingredientSourceMatch = response.match(/INGREDIENT SOURCE: (.+)/);
  
  return {
    restaurant: restaurantMatch?.[1]?.trim() || 'Unknown',
    menuItem: menuItemMatch?.[1]?.trim() || 'Unknown',
    description: descriptionMatch?.[1]?.trim() || 'None listed',
    ingredientSource: ingredientSourceMatch?.[1]?.trim() || 'Not specified'
  };
}

function parseDishAnalysis(response: string) {
  // Extract components and calories from dish analysis with improved parsing
  const foundIngredientsMatch = response.match(/FOUND INGREDIENTS: (.+)/);
  const addedComponentsMatch = response.match(/ADDED STANDARD COMPONENTS: (.+)/);
  const completeListMatch = response.match(/COMPLETE INGREDIENT LIST:(.*?)TOTAL CALORIES:/s);
  
  // Improved calorie extraction - look for multiple patterns
  let caloriesMatch = response.match(/TOTAL CALORIES: (\d+)/);
  if (!caloriesMatch) {
    // Try alternative patterns
    caloriesMatch = response.match(/CALORIES: (\d+)/) || 
                   response.match(/(\d+) calories/) ||
                   response.match(/Total: (\d+)/);
  }
  
  const confidenceMatch = response.match(/CONFIDENCE: (HIGH|MEDIUM|LOW)/i);
  
  return {
    foundIngredients: foundIngredientsMatch?.[1]?.trim() || 'None found in menu',
    addedComponents: addedComponentsMatch?.[1]?.trim() || 'None added',
    completeList: completeListMatch?.[1]?.trim() || 'Components not specified',
    calories: caloriesMatch?.[1]?.trim() || '0',
    confidence: confidenceMatch?.[1]?.trim().toUpperCase() || 'UNKNOWN'
  };
}

function parseModificationAnalysis(response: string) {
  // Improved parsing for Phase 3 with multiple calorie extraction patterns
  const modificationsMatch = response.match(/MODIFICATIONS DETECTED: (.+)/);
  const adjustmentsMatch = response.match(/CALORIE ADJUSTMENTS:(.*?)CALCULATION:/s);
  const calculationMatch = response.match(/CALCULATION: (.+)/);
  
  // Enhanced final calorie extraction
  let finalCaloriesMatch = response.match(/FINAL CALORIES: (\d+)/);
  if (!finalCaloriesMatch) {
    // Try alternative patterns for final calories
    finalCaloriesMatch = response.match(/FINAL: (\d+)/) ||
                        response.match(/Final total: (\d+)/) ||
                        response.match(/= (\d+) calories/) ||
                        response.match(/= (\d+)$/m);
  }
  
  return {
    modifications: modificationsMatch?.[1]?.trim() || 'NONE',
    adjustments: adjustmentsMatch?.[1]?.trim() || 'No adjustments',
    calculation: calculationMatch?.[1]?.trim() || 'No calculation shown',
    finalCalories: finalCaloriesMatch?.[1]?.trim() || '0'
  };
}

// Simple user ID generator for now
function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// Database save function
async function saveToDatabase(result: any) {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .insert([
        {
          user_id: getUserId(),
          restaurant_name: result.restaurant,
          food_description: result.originalInput,
          estimated_calories: result.finalCalories || result.standardCalories || 0,
          raw_ai_response: JSON.stringify(result.rawResponses),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Database save error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Fallback function using the original rule-based approach
function estimateCaloriesFallback(mealDescription: string): CalorieEstimate {
  const description = mealDescription.toLowerCase();
  let totalCalories = 0;
  let matchedItems: string[] = [];
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  // Find matching food items
  const matches = foodDatabase.filter(food => 
    food.keywords.some(keyword => description.includes(keyword))
  );
  
  if (matches.length === 0) {
    // Fallback estimate for unknown foods
    totalCalories = 400;
    matchedItems.push('Unknown meal (estimated)');
    confidence = 'low';
  } else {
    // Calculate base calories from matched items
    matches.forEach(match => {
      totalCalories += match.baseCalories;
      matchedItems.push(match.category);
    });
    
    confidence = matches.length >= 2 ? 'high' : 'medium';
  }
  
  // Apply portion modifiers
  let portionMultiplier = 1.0;
  Object.entries(portionModifiers).forEach(([portion, multiplier]) => {
    if (description.includes(portion)) {
      portionMultiplier = multiplier;
    }
  });
  
  // Apply preparation modifiers
  let preparationMultiplier = 1.0;
  Object.entries(preparationModifiers).forEach(([prep, multiplier]) => {
    if (description.includes(prep)) {
      preparationMultiplier *= multiplier;
    }
  });
  
  totalCalories = Math.round(totalCalories * portionMultiplier * preparationMultiplier);
  
  return {
    calories: totalCalories,
    confidence,
    breakdown: matchedItems
  };
}

export async function estimateCalories(userInput: string): Promise<RestaurantDiscoveryResult> {
  try {
    // Phase 1: Restaurant Discovery - Enhanced with comprehensive search strategy
    const restaurantResponse = await callPerplexityAPI(
      `Find this specific menu item with complete ingredients: "${userInput}"

SEARCH REQUIREMENTS:
1. Extract restaurant name and food item from format: "[food] from/at [restaurant name]"
2. Perform CASE-INSENSITIVE search for restaurant name (ignore capitalization differences)
3. Search variations: exact name, partial matches, common abbreviations
4. Look for restaurant's menu pages, PDF menus, online ordering systems
5. Find the EXACT menu item and its complete ingredient description
6. If found, include the full ingredient list from the menu
7. If restaurant found but item not on menu, note "ITEM NOT ON MENU"
8. If restaurant not found after trying variations, respond "RESTAURANT NOT FOUND"

COMPREHENSIVE SEARCH STRATEGY:
- Primary sources: "[restaurant name] menu", "[restaurant name] PDF menu", "[restaurant name] online ordering"
- PDF menu extraction: Look specifically for PDF menus on restaurant websites and extract text content
- Review sites: Search Yelp, TripAdvisor, Google Maps reviews for dish descriptions and ingredients
- Social media: Check Instagram, Facebook posts for menu photos and dish descriptions
- Food blogs: Look for restaurant reviews mentioning specific dishes and their components
- Delivery apps: Check UberEats, DoorDash, Grubhub for detailed menu descriptions
- Search combinations: "[dish name] [restaurant name]", "[restaurant name] [dish name] ingredients"
- Location context: if location mentioned, include in all searches for better accuracy
- Variations: try different capitalizations, abbreviations, common misspellings of restaurant name

STRICT OUTPUT FORMAT:
RESTAURANT: [name and location if found, or "RESTAURANT NOT FOUND"]
MENU ITEM: [exact item name from menu, or "ITEM NOT FOUND"]  
MENU DESCRIPTION: [complete ingredient list from menu, or "ITEM NOT ON MENU" or "INGREDIENTS NOT LISTED"]
INGREDIENT SOURCE: [where ingredients were found - menu PDF, website, review site, social media, etc., or "NOT FOUND"]
FOUND: [YES if restaurant AND menu item found, NO otherwise]`
    );
    
    // NEW LOGIC: Check if restaurant was actually found by parsing the response
    const restaurantInfo = parseRestaurantInfo(restaurantResponse);
    
    // Determine if restaurant was found based on parsed content, not just "FOUND: YES"
    const restaurantFound = restaurantInfo.restaurant !== 'Unknown' && 
                           restaurantInfo.menuItem !== 'Unknown' &&
                           !restaurantResponse.includes('RESTAURANT NOT FOUND') &&
                           !restaurantResponse.includes('NOT FOUND');

    if (!restaurantFound) {
      return { 
        restaurant: restaurantInfo.restaurant,
        menuItem: restaurantInfo.menuItem,
        description: restaurantInfo.description,
        found: false,
        error: 'Restaurant not found', 
        suggestion: 'Try including restaurant name + location',
        rawResponse: restaurantResponse,
        estimatedCalories: 'Restaurant discovery failed'
      };
    }

    // PHASE 2: Complete Dish Analysis - Enhanced with strict calorie formatting
    const dishResponse = await callPerplexityAPI(
      `Analyze this dish and calculate total calories with precise formatting:

Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${restaurantInfo.menuItem}
Menu Description: ${restaurantInfo.description}
Ingredient Source: ${restaurantInfo.ingredientSource}

CRITICAL REQUIREMENTS:
1. If ingredients were found in Phase 1, use them as the base
2. If ingredients NOT found, research typical components for this dish type
3. Add missing standard components:
   - Burgers: bun (150 cal) + patty (250-400 cal) + cheese (100 cal) + vegetables (20 cal)
   - Coffee drinks: espresso (5 cal) + milk amount and type (varies)
   - Sandwiches: bread (160 cal) + fillings + condiments
4. Calculate realistic restaurant portion sizes
5. MUST provide exact calorie number in specified format

STRICT OUTPUT FORMAT (follow exactly):
FOUND INGREDIENTS: [what was listed in menu, or "None found in menu"]
ADDED STANDARD COMPONENTS: [what you added based on dish type, or "None added"]
COMPLETE INGREDIENT LIST:
- [component 1]: [amount and calories]
- [component 2]: [amount and calories]
- [component 3]: [amount and calories]
TOTAL CALORIES: [NUMBER ONLY - no text, just the number]
CONFIDENCE: [HIGH/MEDIUM/LOW]

Example format:
TOTAL CALORIES: 650
CONFIDENCE: HIGH`
    );

    // Parse Phase 2 response
    const dishAnalysis = parseDishAnalysis(dishResponse);

    // PHASE 3: User Modification Analysis - Enhanced with strict calculation format
    const modificationResponse = await callPerplexityAPI(
      `Calculate final calories after user modifications with precise formatting:

Original Input: "${userInput}"
Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${restaurantInfo.menuItem}
Standard Ingredients: ${dishAnalysis.completeList}
Standard Calories: ${dishAnalysis.calories}

CRITICAL REQUIREMENTS:
1. Analyze original input for modification keywords:
   - Removals: "without", "no", "skip", "hold", "minus" (subtract calories)
   - Additions: "extra", "add", "with extra", "double", "plus" (add calories)
   - Size changes: "small" (-30%), "large" (+40%), "double portion" (+100%)
   - Substitutions: "instead of", "swap", "replace with"
2. Calculate specific calorie adjustments for each modification
3. Show clear math calculation
4. MUST provide exact final number in specified format

STRICT OUTPUT FORMAT (follow exactly):
MODIFICATIONS DETECTED: [list all found, or "NONE"]
CALORIE ADJUSTMENTS:
- [modification 1]: [+/- specific number] calories ([reasoning])
- [modification 2]: [+/- specific number] calories ([reasoning])
CALCULATION: [standard calories] [+/- adjustments] = [final total]
FINAL CALORIES: [NUMBER ONLY - no text, just the number]

Examples:
CALCULATION: 650 - 150 + 50 = 550
FINAL CALORIES: 550

If no modifications:
MODIFICATIONS DETECTED: NONE
CALCULATION: ${dishAnalysis.calories} + 0 = ${dishAnalysis.calories}
FINAL CALORIES: ${dishAnalysis.calories}`
    );

    // Parse Phase 3 response
    const modificationAnalysis = parseModificationAnalysis(modificationResponse);

    // Ensure we have valid calorie numbers
    const standardCalories = parseInt(dishAnalysis.calories) || 0;
    const finalCalories = parseInt(modificationAnalysis.finalCalories) || standardCalories;

    // Prepare complete result for database save
    const finalResult = {
      // Phase 1 results
      restaurant: restaurantInfo.restaurant,
      menuItem: restaurantInfo.menuItem,
      description: restaurantInfo.description,
      found: true,
      
      // Phase 2 results
      ingredientSource: restaurantInfo.ingredientSource,
      foundIngredients: dishAnalysis.foundIngredients,
      addedComponents: dishAnalysis.addedComponents,
      completeIngredients: dishAnalysis.completeList,
      standardCalories: dishAnalysis.calories,
      confidence: dishAnalysis.confidence,
      
      // Phase 3 results
      modificationsDetected: modificationAnalysis.modifications,
      calorieAdjustments: modificationAnalysis.adjustments,
      calculation: modificationAnalysis.calculation,
      finalCalories: finalCalories,
      
      // Metadata
      originalInput: userInput,
      phase: 3,
      timestamp: new Date().toISOString(),
      rawResponses: {
        phase1: restaurantResponse,
        phase2: dishResponse,
        phase3: modificationResponse
      },
      rawResponse: restaurantResponse, // Keep for backward compatibility
      estimatedCalories: `${finalCalories} calories (final estimate)`
    };

    // Save to database
    const saveResult = await saveToDatabase(finalResult);
    finalResult.saved = saveResult.success;
    finalResult.saveError = saveResult.error;

    return finalResult;

  } catch (error) {
    console.error('Three-phase estimation error:', error);
    return { 
      restaurant: 'Unknown',
      menuItem: 'Unknown',
      description: 'None listed',
      found: false,
      error: 'Estimation failed', 
      suggestion: error instanceof Error ? error.message : 'Unknown error occurred',
      rawResponse: '',
      estimatedCalories: 'Estimation failed'
    };
  }
}