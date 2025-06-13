import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { History, Clock, MapPin, Zap, RefreshCw, Trash2, TrendingUp, Calendar, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  averageCalories: number;
  mostFrequentRestaurant: string;
  mostFrequentRestaurantCount: number;
}

interface FoodHistoryProps {
  userId: string;
  refreshTrigger?: number;
}

export default function FoodHistory({ userId, refreshTrigger }: FoodHistoryProps) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEntries();
    loadWeeklyStats();
  }, [userId, refreshTrigger]);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
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
    try {
      setStatsLoading(true);
      
      // Get entries from the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data || data.length === 0) {
        setWeeklyStats({
          totalMeals: 0,
          totalCalories: 0,
          averageCalories: 0,
          mostFrequentRestaurant: 'None',
          mostFrequentRestaurantCount: 0
        });
        return;
      }
      
      // Calculate stats
      const totalMeals = data.length;
      const totalCalories = data.reduce((sum, entry) => sum + entry.estimated_calories, 0);
      const averageCalories = Math.round(totalCalories / totalMeals);
      
      // Find most frequent restaurant
      const restaurantCounts: { [key: string]: number } = {};
      data.forEach(entry => {
        const restaurant = entry.restaurant_name || 'Unknown Restaurant';
        restaurantCounts[restaurant] = (restaurantCounts[restaurant] || 0) + 1;
      });
      
      const mostFrequentRestaurant = Object.keys(restaurantCounts).reduce((a, b) => 
        restaurantCounts[a] > restaurantCounts[b] ? a : b
      );
      
      setWeeklyStats({
        totalMeals,
        totalCalories,
        averageCalories,
        mostFrequentRestaurant,
        mostFrequentRestaurantCount: restaurantCounts[mostFrequentRestaurant]
      });
      
    } catch (err) {
      console.error('Failed to load weekly stats:', err);
      setWeeklyStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  async function deleteEntry(entryId: string) {
    try {
      setDeletingId(entryId);
      
      const { error: deleteError } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);
      
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

  const getTotalCalories = () => {
    return entries.reduce((total, entry) => total + entry.estimated_calories, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading your food history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
            <History className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Failed to Load History
          </h3>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={loadEntries}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        {/* Weekly Analytics Card - Empty State */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Weekly Insights
            </h3>
            <p className="text-xs text-gray-500">
              Start logging meals to see your weekly patterns and insights for the past 7 days.
            </p>
          </div>
        </div>

        {/* Empty History Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              No Food History Yet
            </h3>
            <p className="text-xs text-gray-500">
              Your estimated meals will appear here after you submit them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Analytics Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Weekly Insights
            </h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Past 7 days</span>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading weekly insights...</span>
          </div>
        ) : weeklyStats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-emerald-600 font-medium mb-1">Meals Logged</div>
              <div className="text-lg font-bold text-emerald-700">{weeklyStats.totalMeals}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xs text-blue-600 font-medium mb-1">Avg Calories</div>
              <div className="text-lg font-bold text-blue-700">
                {weeklyStats.totalMeals > 0 ? weeklyStats.averageCalories : 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 col-span-2">
              <div className="text-xs text-purple-600 font-medium mb-1">Top Restaurant</div>
              <div className="text-sm font-bold text-purple-700 truncate">
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
          <div className="text-center py-4">
            <p className="text-xs text-red-600">Failed to load weekly insights</p>
          </div>
        )}
      </div>

      {/* Food History Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
              <History className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Recent Meals
            </h2>
          </div>
          <button
            onClick={loadEntries}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-1 px-3 rounded-lg transition-colors duration-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="text-xs text-emerald-600 font-medium mb-1">Total Entries</div>
            <div className="text-lg font-bold text-emerald-700">{entries.length}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">Total Calories</div>
            <div className="text-lg font-bold text-blue-700">{getTotalCalories().toLocaleString()}</div>
          </div>
        </div>

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
                className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Food Description */}
                    <div className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                      {entry.food_description}
                    </div>
                    
                    {/* Restaurant and Calories */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{entry.restaurant_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Zap className="w-3 h-3 flex-shrink-0" />
                        <span>{entry.estimated_calories} cal</span>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(entry.created_at)}</span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && rawApiResponse && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          AI Analysis Details
                        </h4>
                        <div className="text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                          <div className="whitespace-pre-wrap">{rawApiResponse}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1">
                    {/* Expand/Collapse Button */}
                    {rawApiResponse && (
                      <button
                        onClick={() => toggleEntryExpansion(entry.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title={isExpanded ? "Hide details" : "Show details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete entry"
                    >
                      {deletingId === entry.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Showing your {entries.length} most recent meal{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}