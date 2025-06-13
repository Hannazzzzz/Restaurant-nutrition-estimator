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
  // Extract restaurant name, menu item, description from restaurant discovery
  const restaurantMatch = response.match(/RESTAURANT: (.+)/);
  const menuItemMatch = response.match(/MENU ITEM: (.+)/);
  const descriptionMatch = response.match(/MENU DESCRIPTION: (.+)/);
  
  return {
    restaurant: restaurantMatch?.[1]?.trim() || 'Unknown',
    menuItem: menuItemMatch?.[1]?.trim() || 'Unknown',
    description: descriptionMatch?.[1]?.trim() || 'None listed'
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
    // Phase 1: Restaurant Discovery Only
    const restaurantResponse = await callPerplexityAPI(
      `Find the specific restaurant and menu item for: "${userInput}"

Requirements:
1. The input follows format: "[food description] from/at [restaurant name]"
2. Extract the restaurant name after "from" or "at"
3. Identify the food item before "from" or "at"
4. Find the specific restaurant and verify it exists
5. If restaurant not found, respond "RESTAURANT NOT FOUND"

Format:
RESTAURANT: [name and location]
MENU ITEM: [exact item name]  
MENU DESCRIPTION: [what restaurant lists]
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
        suggestion: 'Try including restaurant name or location',
        rawResponse: restaurantResponse,
        estimatedCalories: 'Restaurant discovery failed'
      };
    }

    return {
      restaurant: restaurantInfo.restaurant,
      menuItem: restaurantInfo.menuItem,
      description: restaurantInfo.description,
      found: true,
      rawResponse: restaurantResponse,
      // Temporary placeholder until Phase 2
      estimatedCalories: 'Restaurant found - dish analysis coming in Phase 2'
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