import { CalorieEstimate } from '../types';
import { estimateCaloriesWithPerplexity } from './perplexityApi';

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

export async function estimateCalories(mealDescription: string): Promise<CalorieEstimate> {
  try {
    // Try Perplexity API first
    const perplexityResult = await estimateCaloriesWithPerplexity(mealDescription);
    return perplexityResult;
  } catch (error) {
    console.warn('Perplexity API failed, falling back to rule-based estimation:', error);
    // Fall back to rule-based estimation
    return estimateCaloriesFallback(mealDescription);
  }
}