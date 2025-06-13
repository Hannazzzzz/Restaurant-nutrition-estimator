import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calculator, Utensils, TrendingUp, AlertCircle, Wifi, WifiOff, Database, TestTube, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { testSupabaseConnection, supabase } from '../lib/supabase';
import { RestaurantDiscoveryResult } from '../types';
import FoodHistory from './FoodHistory';

export default function CalorieEstimator() {
  const [mealDescription, setMealDescription] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<RestaurantDiscoveryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [foodEntriesTestResult, setFoodEntriesTestResult] = useState<{ success: boolean; message?: string; error?: string; data?: any } | null>(null);
  const [isTestingFoodEntries, setIsTestingFoodEntries] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Test database connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setDbStatus(result);
    };
    
    testConnection();
  }, []);

  // Simple user ID generator for now
  function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  // Test function for food_entries table
  const runFoodEntriesTest = async () => {
    setIsTestingFoodEntries(true);
    setFoodEntriesTestResult(null);
    
    try {
      console.log('Testing food_entries table connection...');
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Connection error:', error);
        setFoodEntriesTestResult({
          success: false,
          error: `Table query failed: ${error.message}`
        });
      } else {
        console.log('✅ Supabase connected! Data:', data);
        setFoodEntriesTestResult({
          success: true,
          message: 'Successfully connected to food_entries table',
          data: data
        });
      }
    } catch (err) {
      console.error('❌ Connection failed:', err);
      setFoodEntriesTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestingFoodEntries(false);
    }
  };

  const handleEstimate = async () => {
    if (!mealDescription.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setDiscoveryResult(null);
    
    try {
      // Phase 1: Restaurant Discovery
      const result = await estimateCalories(mealDescription);
      setDiscoveryResult(result);
      
      if (result.error) {
        setError(result.error);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Restaurant discovery error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 relative">
      {/* Built with Bolt Badge */}
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-10 hover:scale-105 transition-transform duration-200"
      >
        <img
          src="/black_circle_360x360.png"
          alt="Built with Bolt"
          className="w-12 h-12 md:w-16 md:h-16"
        />
      </a>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Restaurant Discovery
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Phase 1: Find your restaurant and menu item
          </p>
        </div>

        {/* Database Status Indicator */}
        {dbStatus && (
          <div className={`mb-4 p-3 rounded-xl border ${
            dbStatus.success 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-xs font-medium">
                {dbStatus.success ? '✅ Database Connected' : '❌ Database Connection Failed'}
              </span>
            </div>
            {dbStatus.error && (
              <p className="text-xs mt-1 opacity-75">{dbStatus.error}</p>
            )}
          </div>
        )}

        {/* Food Entries Test Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Database Table Test (Temporary)
          </h3>
          
          <button
            onClick={runFoodEntriesTest}
            disabled={isTestingFoodEntries}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-3"
          >
            {isTestingFoodEntries ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Testing food_entries table...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Test food_entries Table
              </>
            )}
          </button>

          {/* Food Entries Test Result */}
          {foodEntriesTestResult && (
            <div className={`p-3 rounded-xl border ${
              foodEntriesTestResult.success 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {foodEntriesTestResult.success ? '✅ food_entries Table Test Passed' : '❌ food_entries Table Test Failed'}
                </span>
              </div>
              {foodEntriesTestResult.message && (
                <p className="text-xs mt-1">{foodEntriesTestResult.message}</p>
              )}
              {foodEntriesTestResult.error && (
                <p className="text-xs mt-1 opacity-75">{foodEntriesTestResult.error}</p>
              )}
              {foodEntriesTestResult.data && (
                <div className="text-xs mt-2 bg-white bg-opacity-50 p-2 rounded">
                  <strong>Data returned:</strong> {JSON.stringify(foodEntriesTestResult.data, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label htmlFor="meal-input" className="block text-sm font-medium text-gray-700 mb-3">
            Describe your meal with restaurant details
          </label>
          <textarea
            id="meal-input"
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            placeholder="e.g., cortado from Joe & The Juice Copenhagen, Liverpool burger from Halifax restaurant, pad thai at Nong's Khao Man Gai..."
            className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
            disabled={isLoading}
          />
          
          <button
            onClick={handleEstimate}
            disabled={!mealDescription.trim() || isLoading}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Finding restaurant...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Find Restaurant
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Restaurant Discovery Failed</p>
                <p className="text-xs mt-1">{error}</p>
                {discoveryResult?.suggestion && (
                  <p className="text-xs mt-2 text-red-600">
                    💡 {discoveryResult.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Discovery Results */}
        {discoveryResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            {discoveryResult.found ? (
              <div className="restaurant-found">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    🏪 Restaurant Found
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-emerald-800 mb-2">Restaurant</h3>
                    <p className="text-emerald-700 font-semibold">{discoveryResult.restaurant}</p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Menu Item</h3>
                    <p className="text-blue-700 font-semibold">{discoveryResult.menuItem}</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-purple-800 mb-2">Description</h3>
                    <p className="text-purple-700">{discoveryResult.description}</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ Phase 1 Complete - Ready for dish analysis
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {discoveryResult.estimatedCalories}
                  </p>
                </div>
              </div>
            ) : (
              <div className="restaurant-not-found">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    ❌ Restaurant Not Found
                  </h2>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <p className="text-yellow-800 text-sm font-medium mb-2">
                    💡 Try being more specific:
                  </p>
                  <ul className="text-yellow-700 text-xs space-y-1">
                    <li>• Include restaurant name: "burger from McDonald's"</li>
                    <li>• Add location: "pizza from Tony's in Brooklyn"</li>
                    <li>• Be specific: "cortado from Joe & The Juice Copenhagen"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Raw AI Response for debugging */}
            {discoveryResult.rawResponse && (
              <details className="raw-response">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                  Show AI Response (Debug)
                </summary>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {discoveryResult.rawResponse}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Food History Section */}
        <div className="mb-6">
          <FoodHistory 
            userId={getUserId()} 
            refreshTrigger={historyRefreshTrigger}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-gray-500">
            Phase 1: Restaurant Discovery • Phase 2 & 3 coming soon
          </p>
        </div>
      </div>
    </div>
  );
}