import { CalorieEstimate, RestaurantDiscoveryResult } from '../types';
import { callPerplexityAPI } from './perplexityApi';
import { callGoogleCustomSearch, formatSearchResultsForAI } from './googleSearchApi';
import { supabase } from '../lib/supabase';

interface FoodKeyword {
  keywords: string[];
  baseCalories: number;
  category: string;
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
  
  // Coffee & Beverages
  { keywords: ['cortado', 'cappuccino', 'latte'], baseCalories: 80, category: 'coffee drink' },
  { keywords: ['americano', 'black coffee'], baseCalories: 5, category: 'black coffee' },
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

// Enhanced database save function with new schema fields
async function saveToDatabase(result: RestaurantDiscoveryResult) {
  try {
    const finalCalories = result.finalCalories || parseInt(result.standardCalories || '0') || 0;
    
    const { data, error } = await supabase
      .from('food_entries')
      .insert([
        {
          user_id: getUserId(),
          restaurant_name: result.restaurant,
          food_description: result.originalInput,
          estimated_calories: finalCalories,
          raw_ai_response: JSON.stringify(result.rawResponses || result.rawResponse),
          created_at: new Date().toISOString(),
          
          // New schema fields
          restaurant_found_name: result.restaurant_found_name || result.restaurant,
          menu_item_found_name: result.menu_item_found_name || result.menuItem,
          restaurant_calories_exact: result.restaurant_calories_exact || null,
          similar_dish_calories_estimated: result.similar_dish_calories_estimated || null,
          ingredient_calories_estimated: result.ingredient_calories_estimated || null,
          calorie_estimation_source: result.calorie_estimation_source || 'unknown',
          raw_google_search_data: result.raw_google_search_data || null,
          
          // Legacy fields for backward compatibility
          menu_item: result.menuItem,
          standard_calories: parseInt(result.standardCalories || '0') || null,
          final_calories: finalCalories,
          modifications: result.modificationsDetected || null,
          complete_ingredients: result.completeIngredients || null,
          confidence_level: result.confidence || null
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Database save error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function createGoogleSearchQuery(userInput: string): string {
  // Extract restaurant and dish from user input
  const lowerInput = userInput.toLowerCase();
  
  // Try to parse "dish from/at restaurant" format
  let dishPart = '';
  let restaurantPart = '';
  
  if (lowerInput.includes(' from ')) {
    const parts = userInput.split(/ from /i);
    dishPart = parts[0]?.trim() || '';
    restaurantPart = parts[1]?.trim() || '';
  } else if (lowerInput.includes(' at ')) {
    const parts = userInput.split(/ at /i);
    dishPart = parts[0]?.trim() || '';
    restaurantPart = parts[1]?.trim() || '';
  }
  
  if (dishPart && restaurantPart) {
    // Create multiple search variations for better results
    return `"${dishPart}" "${restaurantPart}" menu ingredients calories`;
  }
  
  // Fallback: use the entire input
  return `${userInput} menu ingredients restaurant calories`;
}

function parseRestaurantFromInput(userInput: string): { dish: string; restaurant: string } {
  const lowerInput = userInput.toLowerCase();
  
  if (lowerInput.includes(' from ')) {
    const parts = userInput.split(/ from /i);
    return {
      dish: parts[0]?.trim() || 'Unknown dish',
      restaurant: parts[1]?.trim() || 'Unknown restaurant'
    };
  } else if (lowerInput.includes(' at ')) {
    const parts = userInput.split(/ at /i);
    return {
      dish: parts[0]?.trim() || 'Unknown dish',
      restaurant: parts[1]?.trim() || 'Unknown restaurant'
    };
  }
  
  return {
    dish: userInput,
    restaurant: 'Unknown restaurant'
  };
}

function analyzeSearchResults(searchResults: any[], userInput: string): {
  restaurant: string;
  menuItem: string;
  description: string;
  found: boolean;
  confidence: string;
} {
  const { dish, restaurant } = parseRestaurantFromInput(userInput);
  
  // Look for restaurant mentions in search results
  let restaurantFound = false;
  let menuItemFound = false;
  let bestDescription = 'Menu description not found in search results';
  
  for (const result of searchResults) {
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    const content = `${title} ${snippet}`;
    
    // Check if restaurant name appears in results
    if (content.includes(restaurant.toLowerCase())) {
      restaurantFound = true;
    }
    
    // Check if dish appears in results
    if (content.includes(dish.toLowerCase())) {
      menuItemFound = true;
      // Try to extract a better description from the snippet
      if (result.snippet.length > bestDescription.length) {
        bestDescription = result.snippet;
      }
    }
  }
  
  return {
    restaurant: restaurantFound ? restaurant : 'Restaurant not found in search results',
    menuItem: menuItemFound ? dish : 'Menu item not found in search results',
    description: bestDescription,
    found: restaurantFound && menuItemFound,
    confidence: restaurantFound && menuItemFound ? 'MEDIUM' : 'LOW'
  };
}

function estimateCaloriesFromKeywords(userInput: string): {
  calories: number;
  confidence: string;
  breakdown: string[];
  modifications: string;
} {
  const description = userInput.toLowerCase();
  let totalCalories = 0;
  let matchedItems: string[] = [];
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  
  // Find matching food items
  const matches = foodDatabase.filter(food => 
    food.keywords.some(keyword => description.includes(keyword))
  );
  
  if (matches.length === 0) {
    // Fallback estimate for unknown foods
    totalCalories = 400;
    matchedItems.push('Unknown meal (estimated)');
    confidence = 'LOW';
  } else {
    // Calculate base calories from matched items
    matches.forEach(match => {
      totalCalories += match.baseCalories;
      matchedItems.push(`${match.category} (${match.baseCalories} cal)`);
    });
    
    confidence = matches.length >= 2 ? 'HIGH' : 'MEDIUM';
  }
  
  // Apply portion modifiers
  let portionMultiplier = 1.0;
  let portionMods: string[] = [];
  Object.entries(portionModifiers).forEach(([portion, multiplier]) => {
    if (description.includes(portion)) {
      portionMultiplier = multiplier;
      portionMods.push(`${portion} size (${multiplier}x)`);
    }
  });
  
  // Apply preparation modifiers
  let preparationMultiplier = 1.0;
  let prepMods: string[] = [];
  Object.entries(preparationModifiers).forEach(([prep, multiplier]) => {
    if (description.includes(prep)) {
      preparationMultiplier *= multiplier;
      prepMods.push(`${prep} (${multiplier}x)`);
    }
  });
  
  // Check for removal modifications
  let removalMods: string[] = [];
  if (description.includes('without') || description.includes('no ')) {
    removalMods.push('item removal detected');
    totalCalories *= 0.8; // Reduce by 20% for removals
  }
  
  totalCalories = Math.round(totalCalories * portionMultiplier * preparationMultiplier);
  
  const allMods = [...portionMods, ...prepMods, ...removalMods];
  
  return {
    calories: totalCalories,
    confidence,
    breakdown: matchedItems,
    modifications: allMods.length > 0 ? allMods.join(', ') : 'NONE'
  };
}

// Test mode function (Google + rules)
async function estimateCaloriesTestMode(userInput: string): Promise<RestaurantDiscoveryResult> {
  console.log('🧪 TEST MODE: Starting calorie estimation without Perplexity API for:', userInput);
  
  // Phase 1: Google Custom Search for restaurant discovery
  console.log('Phase 1: Google Custom Search for restaurant discovery');
  
  const searchQuery = createGoogleSearchQuery(userInput);
  console.log('Google search query:', searchQuery);
  
  let searchResults: any[] = [];
  let searchError = null;
  
  try {
    searchResults = await callGoogleCustomSearch(searchQuery, 8);
    console.log(`Found ${searchResults.length} search results`);
  } catch (error) {
    console.warn('Google search failed:', error);
    searchError = error instanceof Error ? error.message : 'Google search failed';
  }
  
  // Analyze search results using rule-based approach
  const searchAnalysis = analyzeSearchResults(searchResults, userInput);
  
  if (!searchAnalysis.found && searchResults.length === 0) {
    return {
      restaurant: searchAnalysis.restaurant,
      menuItem: searchAnalysis.menuItem,
      description: searchAnalysis.description,
      found: false,
      error: searchError || 'No search results found',
      suggestion: 'Try being more specific with restaurant name and location',
      rawResponse: `Google search failed or returned no results. Query: ${searchQuery}`,
      estimatedCalories: 'Search failed',
      googleSearchQuery: searchQuery,
      googleResultsCount: searchResults.length,
      testMode: true,
      calorie_estimation_source: 'search_failed',
      raw_google_search_data: JSON.stringify({ error: searchError, query: searchQuery })
    };
  }
  
  console.log('Phase 1 complete - Restaurant analysis:', searchAnalysis);
  
  // Phase 2: Rule-based calorie estimation
  console.log('Phase 2: Rule-based calorie estimation');
  
  const calorieEstimate = estimateCaloriesFromKeywords(userInput);
  
  console.log('Phase 2 complete - Calorie estimate:', calorieEstimate);
  
  // Phase 3: Modification analysis (simplified)
  console.log('Phase 3: Modification analysis');
  
  const finalCalories = calorieEstimate.calories;
  const calculation = calorieEstimate.modifications !== 'NONE' 
    ? `Base estimate: ${calorieEstimate.calories} cal (with modifications: ${calorieEstimate.modifications})`
    : `Base estimate: ${calorieEstimate.calories} cal (no modifications detected)`;
  
  // Create formatted responses for consistency
  const phase1Response = `🧪 TEST MODE - Google Search Analysis:
RESTAURANT: ${searchAnalysis.restaurant}
MENU ITEM: ${searchAnalysis.menuItem}
MENU DESCRIPTION: ${searchAnalysis.description}
INGREDIENT SOURCE: Google search results analysis
FOUND: ${searchAnalysis.found ? 'YES' : 'NO'}

Search Results Found: ${searchResults.length}
Search Query: ${searchQuery}`;

  const phase2Response = `🧪 TEST MODE - Rule-based Calorie Analysis:
FOUND INGREDIENTS: ${searchAnalysis.description}
ADDED STANDARD COMPONENTS: Based on keyword matching: ${calorieEstimate.breakdown.join(', ')}
COMPLETE INGREDIENT LIST:
${calorieEstimate.breakdown.map(item => `- ${item}`).join('\n')}
TOTAL CALORIES: ${calorieEstimate.calories}
CONFIDENCE: ${calorieEstimate.confidence}`;

  const phase3Response = `🧪 TEST MODE - Modification Analysis:
MODIFICATIONS DETECTED: ${calorieEstimate.modifications}
CALORIE ADJUSTMENTS: Applied automatically in rule-based calculation
CALCULATION: ${calculation}
FINAL CALORIES: ${finalCalories}`;

  // Prepare complete result
  const finalResult: RestaurantDiscoveryResult = {
    // Phase 1 results
    restaurant: searchAnalysis.restaurant,
    menuItem: searchAnalysis.menuItem,
    description: searchAnalysis.description,
    found: searchAnalysis.found,
    
    // Phase 2 results
    ingredientSource: 'Google search results + rule-based analysis',
    foundIngredients: searchAnalysis.description,
    addedComponents: calorieEstimate.breakdown.join(', '),
    completeIngredients: calorieEstimate.breakdown.map(item => `- ${item}`).join('\n'),
    standardCalories: calorieEstimate.calories.toString(),
    confidence: calorieEstimate.confidence,
    
    // Phase 3 results
    modificationsDetected: calorieEstimate.modifications,
    calorieAdjustments: 'Applied in rule-based calculation',
    calculation: calculation,
    finalCalories: finalCalories,
    
    // Metadata
    originalInput: userInput,
    phase: 3,
    timestamp: new Date().toISOString(),
    rawResponses: {
      phase1: phase1Response,
      phase2: phase2Response,
      phase3: phase3Response
    },
    rawResponse: phase1Response,
    estimatedCalories: `${finalCalories} calories (test mode estimate)`,
    
    // Google Search metadata
    googleSearchQuery: searchQuery,
    googleResultsCount: searchResults.length,
    testMode: true,
    
    // New database fields
    restaurant_found_name: searchAnalysis.found ? searchAnalysis.restaurant : null,
    menu_item_found_name: searchAnalysis.found ? searchAnalysis.menuItem : null,
    restaurant_calories_exact: null, // Not available in test mode
    similar_dish_calories_estimated: null, // Not available in test mode
    ingredient_calories_estimated: finalCalories,
    calorie_estimation_source: 'rule_based_google',
    raw_google_search_data: JSON.stringify({
      query: searchQuery,
      results: searchResults,
      analysis: searchAnalysis
    })
  };

  // Save to database
  console.log('Saving to database...');
  const saveResult = await saveToDatabase(finalResult);
  finalResult.saved = saveResult.success;
  finalResult.saveError = saveResult.error;

  console.log('🧪 TEST MODE: Three-phase analysis complete!');
  return finalResult;
}

// Extract dish name from user input for generic estimation
function extractDishFromInput(userInput: string): string {
  const lowerInput = userInput.toLowerCase();
  
  if (lowerInput.includes(' from ')) {
    const parts = userInput.split(/ from /i);
    return parts[0]?.trim() || userInput;
  } else if (lowerInput.includes(' at ')) {
    const parts = userInput.split(/ at /i);
    return parts[0]?.trim() || userInput;
  }
  
  return userInput;
}

// AI mode function (Perplexity API) - Updated with improved logic
async function estimateCaloriesAIMode(userInput: string): Promise<RestaurantDiscoveryResult> {
  console.log('🤖 AI MODE: Starting Perplexity-powered calorie estimation for:', userInput);
  
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
MENU ITEM: [exact item name from menu, or "Not found"]  
MENU DESCRIPTION: [complete ingredient list from menu, or "ITEM NOT ON MENU" or "INGREDIENTS NOT LISTED"]
INGREDIENT SOURCE: [where ingredients were found - menu PDF, website, review site, social media, etc., or "NOT FOUND"]
FOUND: [YES if restaurant AND menu item found, NO otherwise]`
  );
  
  // Parse restaurant info from Phase 1
  const restaurantInfo = parseRestaurantInfo(restaurantResponse);
  
  // NEW LOGIC: Check if restaurant was identified (regardless of menu item)
  const restaurantIdentified = restaurantInfo.restaurant !== 'Unknown' && 
                              restaurantInfo.restaurant !== 'RESTAURANT NOT FOUND' &&
                              !restaurantResponse.includes('RESTAURANT NOT FOUND');

  // Check if specific menu item was found on the restaurant's menu
  const menuItemFoundInRestaurant = restaurantInfo.menuItem !== 'Unknown' && 
                                   restaurantInfo.menuItem !== 'Not found' &&
                                   !restaurantResponse.includes('ITEM NOT ON MENU') &&
                                   !restaurantResponse.includes('NOT FOUND') &&
                                   restaurantResponse.includes('FOUND: YES');

  console.log('Phase 1 Analysis:', {
    restaurantIdentified,
    menuItemFoundInRestaurant,
    restaurant: restaurantInfo.restaurant,
    menuItem: restaurantInfo.menuItem
  });

  if (!restaurantIdentified) {
    return { 
      restaurant: restaurantInfo.restaurant,
      menuItem: restaurantInfo.menuItem,
      description: restaurantInfo.description,
      found: false,
      error: 'Restaurant not found', 
      suggestion: 'Try including restaurant name + location',
      rawResponse: restaurantResponse,
      estimatedCalories: 'Restaurant discovery failed',
      calorie_estimation_source: 'perplexity_ai_failed',
      restaurant_found_name: null,
      menu_item_found_name: null
    };
  }

  // PHASE 2: Complete Dish Analysis - Adjusted based on menu item availability
  let dishAnalysisPrompt: string;
  let menuItemForAnalysis: string;
  let menuDescriptionForAnalysis: string;

  if (menuItemFoundInRestaurant) {
    // Use the specific menu item and description found
    menuItemForAnalysis = restaurantInfo.menuItem;
    menuDescriptionForAnalysis = restaurantInfo.description;
    dishAnalysisPrompt = `Analyze this specific menu item and calculate total calories with precise formatting:

Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${restaurantInfo.menuItem}
Menu Description: ${restaurantInfo.description}
Ingredient Source: ${restaurantInfo.ingredientSource}

CRITICAL REQUIREMENTS:
1. Use the exact ingredients listed in the menu description
2. Add missing standard components typical for this dish type at restaurants
3. Calculate realistic restaurant portion sizes
4. MUST provide exact calorie number in specified format`;
  } else {
    // Restaurant found but menu item not found - estimate generic version
    const genericDish = extractDishFromInput(userInput);
    menuItemForAnalysis = `${genericDish} (generic estimate)`;
    menuDescriptionForAnalysis = `Generic ${genericDish} - menu item not found at ${restaurantInfo.restaurant}`;
    
    dishAnalysisPrompt = `Estimate calories for a generic version of this dish since the specific menu item was not found:

Restaurant: ${restaurantInfo.restaurant} (restaurant found)
Requested Dish: ${genericDish}
Status: Menu item not found at this restaurant
Original Input: ${userInput}

CRITICAL REQUIREMENTS:
1. Since the specific menu item wasn't found, estimate a GENERIC version of "${genericDish}"
2. Use typical restaurant ingredients and portions for this type of dish
3. Add standard components based on dish type:
   - Pizza: dough (200 cal) + sauce (30 cal) + cheese (200-300 cal) + toppings (varies)
   - Burger: bun (150 cal) + patty (250-400 cal) + cheese (100 cal) + vegetables (20 cal)
   - Coffee drinks: espresso (5 cal) + milk amount and type (varies)
   - Pasta: pasta (200 cal) + sauce (100-200 cal) + protein/vegetables (varies)
4. Calculate realistic restaurant portion sizes
5. MUST provide exact calorie number in specified format`;
  }

  const dishResponse = await callPerplexityAPI(
    dishAnalysisPrompt + `

STRICT OUTPUT FORMAT (follow exactly):
FOUND INGREDIENTS: [what was listed in menu, or "Generic ingredients estimated"]
ADDED STANDARD COMPONENTS: [what you added based on dish type, or "None added"]
COMPLETE INGREDIENT LIST:
- [component 1]: [amount and calories]
- [component 2]: [amount and calories]
- [component 3]: [amount and calories]
TOTAL CALORIES: [NUMBER ONLY - no text, just the number]
CONFIDENCE: [HIGH/MEDIUM/LOW]

Example format:
TOTAL CALORIES: 650
CONFIDENCE: ${menuItemFoundInRestaurant ? 'HIGH' : 'MEDIUM'}`
  );

  // Parse Phase 2 response
  const dishAnalysis = parseDishAnalysis(dishResponse);

  // PHASE 3: User Modification Analysis - Enhanced with strict calculation format
  const modificationResponse = await callPerplexityAPI(
    `Calculate final calories after user modifications with precise formatting:

Original Input: "${userInput}"
Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${menuItemForAnalysis}
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
  const finalResult: RestaurantDiscoveryResult = {
    // Phase 1 results - found is true if restaurant identified, regardless of menu item
    restaurant: restaurantInfo.restaurant,
    menuItem: menuItemForAnalysis,
    description: menuDescriptionForAnalysis,
    found: restaurantIdentified, // Changed: based on restaurant identification, not menu item
    
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
    estimatedCalories: `${finalCalories} calories (AI-powered estimate)`,
    
    // New database fields
    restaurant_found_name: restaurantInfo.restaurant,
    menu_item_found_name: menuItemFoundInRestaurant ? restaurantInfo.menuItem : null,
    restaurant_calories_exact: menuItemFoundInRestaurant ? standardCalories : null,
    similar_dish_calories_estimated: !menuItemFoundInRestaurant ? standardCalories : null,
    ingredient_calories_estimated: null, // Not used in AI mode
    calorie_estimation_source: menuItemFoundInRestaurant ? 'perplexity_ai_exact' : 'perplexity_ai_generic',
    raw_google_search_data: null // Not used in AI mode
  };

  // Save to database
  const saveResult = await saveToDatabase(finalResult);
  finalResult.saved = saveResult.success;
  finalResult.saveError = saveResult.error;

  console.log('🤖 AI MODE: Three-phase analysis complete!');
  console.log('Final result summary:', {
    restaurantFound: restaurantIdentified,
    menuItemFound: menuItemFoundInRestaurant,
    finalCalories: finalCalories,
    estimationSource: finalResult.calorie_estimation_source
  });
  
  return finalResult;
}

// Main estimation function with fallback logic
export async function estimateCalories(userInput: string, usePerplexityAPI: boolean = false): Promise<RestaurantDiscoveryResult> {
  try {
    if (usePerplexityAPI) {
      console.log('🤖 Attempting AI Mode with Perplexity API...');
      try {
        return await estimateCaloriesAIMode(userInput);
      } catch (perplexityError) {
        console.warn('🤖 AI Mode failed, falling back to Test Mode:', perplexityError);
        
        // Fallback to test mode if Perplexity fails
        const fallbackResult = await estimateCaloriesTestMode(userInput);
        
        // Add fallback information to the result
        fallbackResult.error = `AI Mode failed: ${perplexityError instanceof Error ? perplexityError.message : 'Unknown error'}. Switched to Test Mode.`;
        fallbackResult.suggestion = 'AI analysis failed, but we provided a rule-based estimate. Check your Perplexity API configuration.';
        fallbackResult.calorie_estimation_source = 'fallback_to_rule_based';
        
        return fallbackResult;
      }
    } else {
      console.log('🧪 Using Test Mode (Google + Rules)...');
      return await estimateCaloriesTestMode(userInput);
    }
  } catch (error) {
    console.error('Complete estimation failure:', error);
    
    let errorMessage = 'Complete estimation failed';
    let suggestion = 'Please try again';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('Perplexity')) {
        suggestion = 'Perplexity API issue. Try switching to Test Mode or check your API key configuration.';
      } else if (error.message.includes('Google')) {
        suggestion = 'Google Search API issue. Please check your API key and search engine ID configuration.';
      }
    }
    
    return { 
      restaurant: 'Unknown',
      menuItem: 'Unknown',
      description: 'None listed',
      found: false,
      error: errorMessage, 
      suggestion: suggestion,
      rawResponse: `${usePerplexityAPI ? '🤖 AI MODE' : '🧪 TEST MODE'} ERROR: ${errorMessage}`,
      estimatedCalories: 'Estimation failed',
      testMode: !usePerplexityAPI,
      calorie_estimation_source: 'complete_failure',
      restaurant_found_name: null,
      menu_item_found_name: null
    };
  }
}