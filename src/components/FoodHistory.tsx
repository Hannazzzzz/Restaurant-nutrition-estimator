import React, { useState, useEffect } from 'react';
import { History, Clock, MapPin, Zap, RefreshCw, Trash2 } from 'lucide-react';
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

interface FoodHistoryProps {
  userId: string;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

export default function FoodHistory({ userId, refreshTrigger }: FoodHistoryProps) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
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

  async function deleteEntry(entryId: string) {
    try {
      setDeletingId(entryId);
      
      const { error: deleteError } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId); // Extra security check
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
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
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
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
        {entries.map((entry) => (
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
              </div>
              
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
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Showing your {entries.length} most recent meal{entries.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}