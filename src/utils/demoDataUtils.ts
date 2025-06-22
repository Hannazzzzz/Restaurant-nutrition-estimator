import { supabase } from '../lib/supabase';
import { sampleFoodEntries } from '../data/sampleData';

export interface DemoDataResult {
  success: boolean;
  message: string;
  entriesInserted?: number;
  error?: string;
}

export async function insertDemoData(userId: string): Promise<DemoDataResult> {
  try {
    console.log('🎭 Inserting demo data for user:', userId);
    
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required to insert demo data');
    }
    
    // Adjust timestamps to be relative to current date (past 7 days)
    const now = new Date();
    const adjustedEntries = sampleFoodEntries.map((entry, index) => {
      // Spread entries across the past 7 days
      const daysAgo = Math.floor(index * 7 / sampleFoodEntries.length);
      const hoursAgo = Math.floor(Math.random() * 24); // Random hour within the day
      const minutesAgo = Math.floor(Math.random() * 60); // Random minute
      
      const adjustedDate = new Date(now);
      adjustedDate.setDate(adjustedDate.getDate() - daysAgo);
      adjustedDate.setHours(adjustedDate.getHours() - hoursAgo);
      adjustedDate.setMinutes(adjustedDate.getMinutes() - minutesAgo);
      
      return {
        user_id: userId,
        restaurant_name: entry.restaurant_name,
        food_description: entry.food_description,
        estimated_calories: entry.estimated_calories,
        raw_ai_response: entry.raw_ai_response,
        created_at: adjustedDate.toISOString(),
        
        // New schema fields
        restaurant_found_name: entry.restaurant_found_name || entry.restaurant_name,
        menu_item_found_name: entry.menu_item_found_name || entry.food_description,
        restaurant_calories_exact: entry.restaurant_calories_exact || null,
        similar_dish_calories_estimated: entry.similar_dish_calories_estimated || null,
        ingredient_calories_estimated: entry.ingredient_calories_estimated || null,
        calorie_estimation_source: entry.calorie_estimation_source || 'demo_data',
        raw_google_search_data: null,
        
        // Legacy fields for backward compatibility
        menu_item: entry.menu_item_found_name || entry.food_description,
        standard_calories: entry.estimated_calories,
        final_calories: entry.estimated_calories,
        modifications: null,
        complete_ingredients: null,
        confidence_level: 'HIGH'
      };
    });
    
    console.log(`Inserting ${adjustedEntries.length} demo entries...`);
    
    // Insert all entries at once
    const { data, error } = await supabase
      .from('food_entries')
      .insert(adjustedEntries);
    
    if (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
    
    console.log('✅ Demo data inserted successfully!');
    
    return {
      success: true,
      message: `Successfully inserted ${adjustedEntries.length} demo food entries`,
      entriesInserted: adjustedEntries.length
    };
    
  } catch (error) {
    console.error('❌ Failed to insert demo data:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: 'Failed to insert demo data',
      error: errorMessage
    };
  }
}

export async function clearUserData(userId: string): Promise<DemoDataResult> {
  try {
    console.log('🗑️ Clearing data for user:', userId);
    
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required to clear data');
    }
    
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database deletion error:', error);
      throw error;
    }
    
    console.log('✅ User data cleared successfully!');
    
    return {
      success: true,
      message: `Successfully cleared all data for user: ${userId}`
    };
    
  } catch (error) {
    console.error('❌ Failed to clear user data:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: 'Failed to clear user data',
      error: errorMessage
    };
  }
}