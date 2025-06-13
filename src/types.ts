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
}