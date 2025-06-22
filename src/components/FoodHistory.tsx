import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { History, Clock, MapPin, Zap, RefreshCw, Trash2, TrendingUp, Calendar, ChevronDown, ChevronUp, Eye, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sampleFoodEntries } from '../data/sampleData';

interface FoodEntry {
  id: string;
  user_id: string;
  restaurant_name: string;
  food_description: string;
  estimated_calories: number;
  raw_ai_response: string;
  created_at: string;
}

interface WeeklyStats {
  totalMeals: number;
  totalCalories: number;
  averageCaloriesPerDay: number;
  mostFrequentRestaurant: string;
  mostFrequentRestaurantCount: number;
}

interface FoodHistoryProps {
  userId?: string;
  refreshTrigger?: number;
}

export default function FoodHistory({ userId, refreshTrigger }: FoodHistoryProps) {
  const { username } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Check for demo mode
  const isDemoMode = window.location.search.includes('demo=true');

  // Use the username from auth context, fallback to userId prop
  const effectiveUserId = username || userId;

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else if (effectiveUserId) {
      loadEntries();
      loadWeeklyStats();
    }
  }, [effectiveUserId, refreshTrigger, isDemoMode]);

  function loadDemoData() {
    try {
      setLoading(true);
      setStatsLoading(true);
      setError(null);
      
      // Use sample data for demo mode
      const demoEntries = sampleFoodEntries.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        restaurant_name: entry.restaurant_name,
        food_description: entry.food_description,
        estimated_calories: entry.estimated_calories,
        raw_ai_response: entry.raw_ai_response,
        created_at: entry.created_at
      }));
      
      setEntries(demoEntries);
      
      // Calculate demo stats
      const totalMeals = demoEntries.length;
      const totalCalories = demoEntries.reduce((sum, entry) => sum + entry.estimated_calories, 0);
      const averageCaloriesPerDay = Math.round(totalCalories / 7);
      
      // Find most frequent restaurant
      const restaurantCounts: { [key: string]: number } = {};
      demoEntries.forEach(entry => {
        const restaurant = entry.restaurant_name;
        restaurantCounts[restaurant] = (restaurantCounts[restaurant] || 0) + 1;
      });
      
      const mostFrequentRestaurant = Object.keys(restaurantCounts).reduce((a, b) => 
        restaurantCounts[a] > restaurantCounts[b] ? a : b
      );
      
      setWeeklyStats({
        totalMeals,
        totalCalories,
        averageCaloriesPerDay,
        mostFrequentRestaurant,
        mostFrequentRestaurantCount: restaurantCounts[mostFrequentRestaurant]
      });
      
    } catch (err) {
      console.error('Failed to load demo data:', err);
      setError('Failed to load demo data');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }

  async function loadEntries() {
    if (!effectiveUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get entries from the past 7 days for Recent Meals section
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load food history');
    } finally {
      setLoading(false);
    }
  }

  async function loadWeeklyStats() {
    if (!effectiveUserId) return;
    
    try {
      setStatsLoading(true);
      
      // Get entries from the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data || data.length === 0) {
        setWeeklyStats({
          totalMeals: 0,
          totalCalories: 0,
          averageCaloriesPerDay: 0,
          mostFrequentRestaurant: 'None',
          mostFrequentRestaurantCount: 0
        });
        return;
      }
      
      // Calculate stats
      const totalMeals = data.length;
      const totalCalories = data.reduce((sum, entry) => sum + (entry.estimated_calories || 0), 0);
      
      // Fixed calculation: total calories divided by 7 days (not by number of meals)
      const averageCaloriesPerDay = Math.round(totalCalories / 7);
      
      // Find most frequent restaurant
      const restaurantCounts: { [key: string]: number } = {};
      data.forEach(entry => {
        const restaurant = entry.restaurant_name || 'Unknown Restaurant';
        restaurantCounts[restaurant] = (restaurantCounts[restaurant] || 0) + 1;
      });
      
      let mostFrequentRestaurant = 'None';
      let mostFrequentRestaurantCount = 0;
      
      if (Object.keys(restaurantCounts).length > 0) {
        mostFrequentRestaurant = Object.keys(restaurantCounts).reduce((a, b) => 
          restaurantCounts[a] > restaurantCounts[b] ? a : b
        );
        mostFrequentRestaurantCount = restaurantCounts[mostFrequentRestaurant];
      }
      
      setWeeklyStats({
        totalMeals,
        totalCalories,
        averageCaloriesPerDay,
        mostFrequentRestaurant,
        mostFrequentRestaurantCount
      });
      
    } catch (err) {
      console.error('Failed to load weekly stats:', err);
      setWeeklyStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!effectiveUserId || isDemoMode) return;
    
    try {
      setDeletingId(entryId);
      
      const { error: deleteError } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', effectiveUserId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      // Reload weekly stats after deletion
      loadWeeklyStats();
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  }

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="canopy-content rounded-2xl p-6">
        <div className="flex items-center justify-center gap-2 text-gray-300">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading your weekly insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="canopy-content rounded-2xl p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-900/20 rounded-full mb-3">
            <TrendingUp className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-2">
            Failed to Load Weekly Insights
          </h3>
          <p className="text-xs text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              if (isDemoMode) {
                loadDemoData();
              } else {
                loadEntries();
                loadWeeklyStats();
              }
            }}
            className="text-xs bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="canopy-content rounded-2xl p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-3">
            <TrendingUp className="w-6 h-6 text-blue-300" />
          </div>
          <h3 className="text-sm font-medium text-white mb-2">
            Weekly Insights
          </h3>
          <p className="text-xs text-gray-300">
            Start logging meals to see your weekly patterns and insights for the past 7 days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="canopy-content rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Weekly Insights
          </h2>
          {isDemoMode && (
            <span className="text-xs text-yellow-300/80 bg-yellow-500/20 px-2 py-1 rounded-full ml-2">
              Demo Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>Past 7 days</span>
          </div>
          {!isDemoMode && (
            <button
              onClick={() => {
                loadEntries();
                loadWeeklyStats();
              }}
              className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 font-medium py-1 px-3 rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Weekly Analytics */}
      {statsLoading ? (
        <div className="flex items-center justify-center gap-2 text-gray-300 py-4 mb-6">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading weekly insights...</span>
        </div>
      ) : weeklyStats ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-3 border border-white/20">
            <div className="text-xs text-emerald-300 font-medium mb-1">Meals Logged</div>
            <div className="text-lg font-bold text-emerald-200">{weeklyStats.totalMeals}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/20">
            <div className="text-xs text-blue-300 font-medium mb-1">Avg Cal/Day</div>
            <div className="text-lg font-bold text-blue-200">
              {weeklyStats.averageCaloriesPerDay}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 col-span-2 border border-white/20">
            <div className="text-xs text-purple-300 font-medium mb-1">Top Restaurant</div>
            <div className="text-sm font-bold text-purple-200 truncate">
              {weeklyStats.mostFrequentRestaurant}
              {weeklyStats.mostFrequentRestaurantCount > 1 && (
                <span className="text-xs font-normal ml-1">
                  ({weeklyStats.mostFrequentRestaurantCount} visits)
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 mb-6">
          <p className="text-xs text-red-400">Failed to load weekly insights</p>
        </div>
      )}

      {/* Meals Section - Simplified Layout */}
      <div className="border-t border-white/20 pt-6">
        {/* Entries List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {entries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            let parsedAiResponse = null;
            let rawApiResponse = null;
            
            try {
              parsedAiResponse = JSON.parse(entry.raw_ai_response);
              rawApiResponse = parsedAiResponse?.rawApiResponse;
            } catch (e) {
              // If parsing fails, treat the raw_ai_response as the actual response
              rawApiResponse = entry.raw_ai_response;
            }

            return (
              <div
                key={entry.id}
                className="border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Single line with all info */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {/* Food Description */}
                    <div className="font-medium text-white text-sm truncate">
                      {entry.food_description}
                    </div>
                    
                    {/* Restaurant */}
                    <div className="text-xs text-gray-300 truncate">
                      {entry.restaurant_name}
                    </div>
                    
                    {/* Calories */}
                    <div className="text-xs font-medium text-emerald-300 flex-shrink-0">
                      {entry.estimated_calories} cal
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Expand/Collapse Button */}
                    {rawApiResponse && (
                      <button
                        onClick={() => toggleEntryExpansion(entry.id)}
                        className="flex-shrink-0 p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                        title={isExpanded ? "Hide details" : "Show details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Delete Button - Only show in non-demo mode */}
                    {!isDemoMode && (
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                        className="flex-shrink-0 p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete entry"
                      >
                        {deletingId === entry.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Arrow - Always last */}
                    <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && rawApiResponse && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                    <h4 className="text-xs font-medium text-gray-200 mb-2 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      AI Analysis Details
                    </h4>
                    <div className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                      <div className="whitespace-pre-wrap">{rawApiResponse}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-gray-400 text-center">
            Showing {entries.length} meal{entries.length !== 1 ? 's' : ''} from the past 7 days
            {isDemoMode && (
              <span className="block mt-1 text-yellow-300/60">
                This is sample data for demonstration purposes
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}