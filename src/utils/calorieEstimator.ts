import { CalorieEstimate } from '../types';
import { callPerplexityAPI } from './perplexityApi';

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
  };
  phase?: number;
  ready?: string;
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
  // Extract components and calories from dish analysis
  const foundIngredientsMatch = response.match(/FOUND INGREDIENTS: (.+)/);
  const addedComponentsMatch = response.match(/ADDED STANDARD COMPONENTS: (.+)/);
  const completeListMatch = response.match(/COMPLETE INGREDIENT LIST:(.*?)TOTAL CALORIES:/s);
  const caloriesMatch = response.match(/TOTAL CALORIES: (\d+)/);
  const confidenceMatch = response.match(/CONFIDENCE: (.+)/);
  
  return {
    foundIngredients: foundIngredientsMatch?.[1]?.trim() || 'None found in menu',
    addedComponents: addedComponentsMatch?.[1]?.trim() || 'None added',
    completeList: completeListMatch?.[1]?.trim() || 'Components not specified',
    calories: caloriesMatch?.[1]?.trim() || '0',
    confidence: confidenceMatch?.[1]?.trim() || 'UNKNOWN'
  };
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
    // Phase 1: Restaurant Discovery - Enhanced with direct menu search
    const restaurantResponse = await callPerplexityAPI(
      `Find this specific menu item with complete ingredients: "${userInput}"

Requirements:
1. Extract restaurant name and food item from format: "[food] from/at [restaurant name]"
2. Search for the restaurant's menu pages, PDF menus, or online ordering systems
3. Find the EXACT menu item and its complete ingredient description
4. If found, include the full ingredient list from the menu
5. If restaurant found but item not on menu, note "ITEM NOT ON MENU"
6. If restaurant not found, respond "RESTAURANT NOT FOUND"

Search strategy:
- Look for: "[restaurant name] menu", "[restaurant name] PDF menu", "[restaurant name] food"
- Include: actual ingredient lists, not just item names
- Prioritize: official restaurant websites and menu documents

Format:
RESTAURANT: [name and location]
MENU ITEM: [exact item name from menu]  
MENU DESCRIPTION: [complete ingredient list from menu, or "ITEM NOT ON MENU" or "INGREDIENTS NOT LISTED"]
INGREDIENT SOURCE: [where the ingredients were found - menu PDF, website, etc.]
FOUND: YES/NO`
    );

    // Parse restaurant discovery response
    const restaurantFound = restaurantResponse.includes('FOUND: YES');
    const restaurantInfo = parseRestaurantInfo(restaurantResponse);

    if (!restaurantFound) {
      return { 
        restaurant: 'Unknown',
        menuItem: 'Unknown',
        description: 'None listed',
        found: false,
        error: 'Restaurant not found', 
        suggestion: 'Try including restaurant name + location',
        rawResponse: restaurantResponse,
        estimatedCalories: 'Restaurant discovery failed'
      };
    }

    // PHASE 2: Complete Dish Analysis - Adaptive based on ingredient detail level
    const dishResponse = await callPerplexityAPI(
      `Analyze this dish and determine complete ingredients:

Restaurant: ${restaurantInfo.restaurant}
Menu Item: ${restaurantInfo.menuItem}
Menu Description: ${restaurantInfo.description}
Ingredient Source: ${restaurantInfo.ingredientSource}

Requirements:
1. If ingredients were found in Phase 1, use them as the base
2. If ingredients NOT found or only basic info available, research what this dish type typically contains
3. For missing components, add standard elements:
   - Burgers: always include bun + patty + standard toppings
   - Coffee drinks: espresso base + specified milk type and amount
   - Sandwiches: bread + listed fillings + typical condiments
4. Research typical restaurant portions for this establishment type
5. Calculate complete calorie total

Format:
FOUND INGREDIENTS: [what was listed in menu, if any]
ADDED STANDARD COMPONENTS: [what you added based on dish type]
COMPLETE INGREDIENT LIST:
- [component 1]: [amount]
- [component 2]: [amount]
TOTAL CALORIES: [calculated total]
CONFIDENCE: [HIGH/MEDIUM/LOW based on ingredient detail available]`
    );

    // Parse Phase 2 response
    const dishAnalysis = parseDishAnalysis(dishResponse);

    return {
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
      
      // Raw responses for debugging
      rawResponses: {
        phase1: restaurantResponse,
        phase2: dishResponse
      },
      rawResponse: restaurantResponse, // Keep for backward compatibility
      
      // Status
      phase: 2,
      ready: 'Phase 2 Complete - Ready for modification analysis',
      estimatedCalories: `${dishAnalysis.calories} calories (standard menu version)`
    };

  } catch (error) {
    console.error('Restaurant discovery error:', error);
    return { 
      restaurant: 'Unknown',
      menuItem: 'Unknown',
      description: 'None listed',
      found: false,
      error: 'Restaurant discovery failed', 
      suggestion: error instanceof Error ? error.message : 'Unknown error occurred',
      rawResponse: '',
      estimatedCalories: 'Discovery failed'
    };
  }
}