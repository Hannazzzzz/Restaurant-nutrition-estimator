import { CalorieEstimate } from '../types';
import { callGoogleCustomSearch, formatSearchResultsForAI } from './googleSearchApi';
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
  
  // Google Search metadata
  googleSearchQuery?: string;
  googleResultsCount?: number;
  testMode?: boolean;
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
          raw_ai_response: JSON.stringify(result.rawResponses || result.rawResponse),
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

export async function estimateCalories(userInput: string): Promise<RestaurantDiscoveryResult> {
  try {
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
        testMode: true
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
    const finalResult = {
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
      testMode: true
    };

    // Save to database
    console.log('Saving to database...');
    const saveResult = await saveToDatabase(finalResult);
    finalResult.saved = saveResult.success;
    finalResult.saveError = saveResult.error;

    console.log('🧪 TEST MODE: Three-phase analysis complete!');
    return finalResult;

  } catch (error) {
    console.error('Test mode estimation error:', error);
    
    let errorMessage = 'Test mode estimation failed';
    let suggestion = 'Please try again';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('Google')) {
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
      rawResponse: `🧪 TEST MODE ERROR: ${errorMessage}`,
      estimatedCalories: 'Test mode estimation failed',
      testMode: true
    };
  }
}