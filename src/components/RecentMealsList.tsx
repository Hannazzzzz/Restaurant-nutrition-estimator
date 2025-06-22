import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { sampleFoodEntries } from '../data/sampleData';

interface FoodEntry {
  id: string;
  user_id: string;
  restaurant_name: string;
  food_description: string;
  estimated_calories: number;
  created_at: string;
}

interface RecentMealsListProps {
  refreshTrigger?: number;
}

export default function RecentMealsList({ refreshTrigger }: RecentMealsListProps) {
  const { username, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Check for demo mode
  const isDemoMode = window.location.search.includes('demo=true');

  useEffect(() => {
    if (isDemoMode) {
      // Use sample data in demo mode
      const recentSampleEntries = sampleFoodEntries
        .slice(0, 5) // Get the 5 most recent
        .map(entry => ({
          id: entry.id,
          user_id: entry.user_id,
          restaurant_name: entry.restaurant_name,
          food_description: entry.food_description,
          estimated_calories: entry.estimated_calories,
          created_at: entry.created_at
        }));
      setEntries(recentSampleEntries);
    } else if (isLoggedIn && username) {
      loadRecentEntries();
    }
  }, [username, isLoggedIn, refreshTrigger, isDemoMode]);

  async function loadRecentEntries() {
    if (!username) return;
    
    try {
      setLoading(true);
      
      // Get entries from the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('id, user_id, restaurant_name, food_description, estimated_calories, created_at')
        .eq('user_id', username)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5); // Show only the 5 most recent entries
      
      if (error) {
        console.error('Failed to load recent entries:', error);
        return;
      }
      
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load recent entries:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEntryClick = () => {
    navigate('/weekly-analysis');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Don't show anything if user is not logged in and not in demo mode
  if (!isDemoMode && !isLoggedIn) {
    return null;
  }

  // Don't show anything if loading or no entries (except in demo mode)
  if (!isDemoMode && (loading || entries.length === 0)) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Meals
        </h3>
        {isDemoMode && (
          <span className="text-xs text-yellow-300/80 bg-yellow-500/20 px-2 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={handleEntryClick}
            className="group cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/80 text-sm font-medium truncate">
                    {entry.food_description}
                  </p>
                  <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-white/60 transition-colors duration-200 flex-shrink-0" />
                </div>
                
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{entry.restaurant_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{entry.estimated_calories} cal</span>
                  </div>
                  <span>{formatTimeAgo(entry.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* View All Button */}
        <div
          onClick={handleEntryClick}
          className="group cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg p-3 border-t border-white/10 mt-3"
        >
          <div className="flex items-center justify-center gap-2 text-white/60 group-hover:text-white/80 transition-colors duration-200">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">View Weekly Analysis</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}