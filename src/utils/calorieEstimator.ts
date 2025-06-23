import { CalorieEstimate, RestaurantDiscoveryResult } from '../types';
import { callPerplexityAPI } from './perplexityApi';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getUsername } from './userUtils';

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

// Enhanced database save function with new schema fields
async function saveToDatabase(result: RestaurantDiscoveryResult) {
  try {


    const finalCalories = result.finalCalories || parseInt(result.standardCalories || '0') || 0;
    
    const { data, error } = await supabase
      .from('food_entries')
      .insert([
        {
          user_id: username,
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

// Check if input contains restaurant information
function hasRestaurantInfo(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase();
  return lowerInput.includes(' from ') || lowerInput.includes(' at ');
}

// AI mode function (Perplexity API) - Updated with improved logic for flexible input
async function estimateCaloriesAIMode(userInput: string): Promise<RestaurantDiscoveryResult> {
  console.log('🤖 AI MODE: Starting Perplexity-powered calorie estimation for:', userInput);
  
  // Check if input contains restaurant information
  const hasRestaurant = hasRestaurantInfo(userInput);
  
  let restaurantResponse: string;
  let restaurantInfo: any;
  let restaurantIdentified = false;
  let menuItemFoundInRestaurant = false;
  
  if (hasRestaurant) {
    // Phase 1: Restaurant Discovery - Enhanced with comprehensive search strategy
    restaurantResponse = await callPerplexityAPI(
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
    restaurantInfo = parseRestaurantInfo(restaurantResponse);
    
    // Check if restaurant was identified (regardless of menu item)
    restaurantIdentified = restaurantInfo.restaurant !== 'Unknown' && 
                          restaurantInfo.restaurant !== 'RESTAURANT NOT FOUND' &&
                          !restaurantResponse.includes('RESTAURANT NOT FOUND');

    // Check if specific menu item was found on the restaurant's menu
    menuItemFoundInRestaurant = restaurantInfo.menuItem !== 'Unknown' && 
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
  } else {
    // No restaurant specified - create a generic response for Phase 1
    const genericDish = extractDishFromInput(userInput);
    restaurantResponse = `Generic food analysis for: "${userInput}"

RESTAURANT: Generic/Unknown (no restaurant specified)
MENU ITEM: ${genericDish}
MENU DESCRIPTION: Generic ${genericDish} - no specific restaurant menu
INGREDIENT SOURCE: Generic food knowledge
FOUND: NO (no restaurant specified)`;

    restaurantInfo = {
      restaurant: 'Generic/Unknown',
      menuItem: genericDish,
      description: `Generic ${genericDish} - no specific restaurant menu`,
      ingredientSource: 'Generic food knowledge'
    };
    
    restaurantIdentified = true; // Allow processing to continue
    menuItemFoundInRestaurant = false; // No specific restaurant menu
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
    // Restaurant found but menu item not found OR no restaurant specified - estimate generic version
    const genericDish = extractDishFromInput(userInput);
    menuItemForAnalysis = `${genericDish} (generic estimate)`;
    
    if (hasRestaurant) {
      menuDescriptionForAnalysis = `Generic ${genericDish} - menu item not found at ${restaurantInfo.restaurant}`;
      dishAnalysisPrompt = `Estimate calories for a generic version of this dish since the specific menu item was not found:

Restaurant: ${restaurantInfo.restaurant} (restaurant found)
Requested Dish: ${genericDish}
Status: Menu item not found at this restaurant
Original Input: ${userInput}`;
    } else {
      menuDescriptionForAnalysis = `Generic ${genericDish} - no specific restaurant`;
      dishAnalysisPrompt = `Estimate calories for this food item using typical restaurant/commercial portions:

Food Item: ${genericDish}
Status: No specific restaurant mentioned
Original Input: ${userInput}`;
    }
    
    dishAnalysisPrompt += `

CRITICAL REQUIREMENTS:
1. Estimate a GENERIC version of "${genericDish}" using typical restaurant portions
2. Use standard restaurant ingredients and portions for this type of dish
3. Add standard components based on dish type:
   - Pizza: dough (200 cal) + sauce (30 cal) + cheese (200-300 cal) + toppings (varies)
   - Burger: bun (150 cal) + patty (250-400 cal) + cheese (100 cal) + vegetables (20 cal)
   - Coffee drinks: espresso (5 cal) + milk amount and type (varies)
   - Pasta: pasta (200 cal) + sauce (100-200 cal) + protein/vegetables (varies)
   - Sandwiches: bread (160 cal) + fillings + condiments
   - Salads: greens (20 cal) + protein + dressing + toppings
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

  // PHASE 3: User Modification Analysis - Updated to use "Total Calories" instead of "Standard Calories"
  const modificationResponse = await callPerplexityAPI(
    `Calculate final calories after user modifications with precise formatting:

Original Input: "${userInput}"
Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${menuItemForAnalysis}
Standard Ingredients: ${dishAnalysis.completeList}
Total Calories: ${dishAnalysis.calories}

CRITICAL REQUIREMENTS:
1. The 'Total Calories' value provided (${dishAnalysis.calories}) MUST be the exact starting point for your 'CALCULATION'. Do NOT re-estimate or modify this base value.
2. Analyze original input for modification keywords:
   - Removals: "without", "no", "skip", "hold", "minus" (subtract calories)
   - Additions: "extra", "add", "with extra", "double", "plus" (add calories)
   - Size changes: "small" (-30%), "large" (+40%), "double portion" (+100%)
   - Substitutions: "instead of", "swap", "replace with"
3. Calculate specific calorie adjustments for each modification
4. Show clear math calculation starting with the provided Total Calories
5. MUST provide exact final number in specified format

STRICT OUTPUT FORMAT (follow exactly):
MODIFICATIONS DETECTED: [list all found, or "NONE"]
CALORIE ADJUSTMENTS:
- [modification 1]: [+/- specific number] calories ([reasoning])
- [modification 2]: [+/- specific number] calories ([reasoning])
CALCULATION: [total calories] [+/- adjustments] = [final total]
FINAL CALORIES: [NUMBER ONLY - no text, just the number]

Examples:
CALCULATION: ${dishAnalysis.calories} - 150 + 50 = [result]
FINAL CALORIES: [result]

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

  // Determine estimation source
  let estimationSource = 'perplexity_ai_generic';
  if (hasRestaurant && menuItemFoundInRestaurant) {
    estimationSource = 'perplexity_ai_exact';
  } else if (hasRestaurant && !menuItemFoundInRestaurant) {
    estimationSource = 'perplexity_ai_generic';
  } else {
    estimationSource = 'perplexity_ai_no_restaurant';
  }

  // Prepare complete result for database save
  const finalResult: RestaurantDiscoveryResult = {
    // Phase 1 results - found is true if restaurant identified OR if it's a generic food item
    restaurant: restaurantInfo.restaurant,
    menuItem: menuItemForAnalysis,
    description: menuDescriptionForAnalysis,
    found: restaurantIdentified, // Changed: based on restaurant identification or generic processing
    
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
    restaurant_found_name: hasRestaurant ? restaurantInfo.restaurant : null,
    menu_item_found_name: menuItemFoundInRestaurant ? restaurantInfo.menuItem : null,
    restaurant_calories_exact: menuItemFoundInRestaurant ? standardCalories : null,
    similar_dish_calories_estimated: !menuItemFoundInRestaurant ? standardCalories : null,
    ingredient_calories_estimated: null, // Not used in AI mode
    calorie_estimation_source: estimationSource,
    raw_google_search_data: null // Not used in AI mode
  };

  // Save to database
  const saveResult = await saveToDatabase(finalResult);
  finalResult.saved = saveResult.success;
  finalResult.saveError = saveResult.error;

  console.log('🤖 AI MODE: Three-phase analysis complete!');
  console.log('Final result summary:', {
    hasRestaurant: hasRestaurant,
    restaurantFound: restaurantIdentified,
    menuItemFound: menuItemFoundInRestaurant,
    finalCalories: finalCalories,
    estimationSource: finalResult.calorie_estimation_source
  });
  
  return finalResult;
}

// Main estimation function - Always use AI mode
export async function estimateCalories(userInput: string, usePerplexityAPI: boolean = true): Promise<RestaurantDiscoveryResult> {
  try {
    console.log('🤖 Using AI Mode with Perplexity API...');
    return await estimateCaloriesAIMode(userInput);
  } catch (error) {
    console.error('AI estimation failed:', error);
    
    let errorMessage = 'AI analysis failed';
    let suggestion = 'Please try again';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('Perplexity')) {
        suggestion = 'Perplexity API issue. Please check your API key configuration.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        suggestion = 'Network connectivity issue. Please check your internet connection and try again.';
      }
    }
    
    return { 
      restaurant: 'Unknown',
      menuItem: 'Unknown',
      description: 'None listed',
      found: false,
      error: errorMessage, 
      suggestion: suggestion,
      rawResponse: `🤖 AI MODE ERROR: ${errorMessage}`,
      estimatedCalories: 'AI analysis failed',
      calorie_estimation_source: 'ai_failure',
      restaurant_found_name: null,
      menu_item_found_name: null
    };
  }
}