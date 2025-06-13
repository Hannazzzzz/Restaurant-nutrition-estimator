export interface CalorieEstimate {
  calories: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: string[];
  rawApiResponse?: string;
}

export interface RestaurantDiscoveryResult {
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