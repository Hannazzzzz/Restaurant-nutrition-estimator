import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calculator, Utensils, TrendingUp, AlertCircle, Wifi, WifiOff, Database, TestTube } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { testSupabaseConnection, supabase } from '../lib/supabase';
import { CalorieEstimate } from '../types';
import FoodHistory from './FoodHistory';

export default function CalorieEstimator() {
  const [mealDescription, setMealDescription] = useState('');
  const [estimate, setEstimate] = useState<CalorieEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [foodEntriesTestResult, setFoodEntriesTestResult] = useState<{ success: boolean; message?: string; error?: string; data?: any } | null>(null);
  const [isTestingFoodEntries, setIsTestingFoodEntries] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
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

  // Extract restaurant name from AI response breakdown
  function extractRestaurantName(breakdown: string[]): string {
    const restaurantEntry = breakdown.find(item => 
      item.toLowerCase().includes('restaurant:')
    );
    
    if (restaurantEntry) {
      return restaurantEntry.replace(/restaurant:\s*/i, '').trim();
    }
    
    return 'Unknown Restaurant';
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
    setIsUsingAI(false);
    setSavedEntryId(null);
    
    try {
      // Get AI estimate (existing Perplexity call)
      const aiResponse = await estimateCalories(mealDescription);
      
      // Check if we're likely using Perplexity API (has raw response)
      setIsUsingAI(!!aiResponse.rawApiResponse);
      
      // Save to database
      try {
        const restaurantName = extractRestaurantName(aiResponse.breakdown);
        
        const { data, error: saveError } = await supabase
          .from('food_entries')
          .insert({
            user_id: getUserId(),
            restaurant_name: restaurantName,
            food_description: mealDescription,
            estimated_calories: aiResponse.calories,
            raw_ai_response: JSON.stringify(aiResponse)
          })
          .select();
        
        if (saveError) {
          console.error('❌ Save failed:', saveError);
          // Still show AI response even if save fails
          setError(`Calorie estimate completed, but failed to save: ${saveError.message}`);
        } else {
          console.log('✅ Saved entry:', data[0]);
          setSavedEntryId(data[0].id);
          // Trigger history refresh
          setHistoryRefreshTrigger(prev => prev + 1);
        }
      } catch (saveErr) {
        console.error('❌ Save failed:', saveErr);
        // Still show AI response even if save fails
        setError(`Calorie estimate completed, but failed to save to database.`);
      }
      
      // Show success + AI response
      setEstimate(aiResponse);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Calorie estimation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
      default: return 'Unknown';
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
            Calorie Estimator
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Describe your restaurant meal and get an AI-powered calorie estimate
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
            Describe your meal
          </label>
          <textarea
            id="meal-input"
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            placeholder="e.g., pad thai at local Thai restaurant, Large burger with fries and a coke, Grilled salmon with rice..."
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
                Analyzing with AI...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Estimate Calories
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
                <p className="font-medium text-sm">Estimation Failed</p>
                <p className="text-xs mt-1">{error}</p>
                <p className="text-xs mt-2 text-red-600">
                  Make sure you have set your Perplexity API key in the environment variables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {estimate && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Estimated Calories
              </h2>
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {estimate.calories}
              </div>
            </div>

            {/* Save Status Indicator */}
            {savedEntryId && (
              <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Saved to Database (ID: {savedEntryId})
                </span>
              </div>
            )}

            {/* AI Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg">
              {isUsingAI ? (
                <>
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    AI-Powered Analysis
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">
                    Rule-Based Estimation
                  </span>
                </>
              )}
            </div>

            {/* Confidence Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
              <AlertCircle className={`w-4 h-4 ${getConfidenceColor(estimate.confidence)}`} />
              <span className={`text-sm font-medium ${getConfidenceColor(estimate.confidence)}`}>
                {getConfidenceText(estimate.confidence)}
              </span>
            </div>

            {/* Detailed Analysis with Markdown Rendering */}
            {estimate.rawApiResponse && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Detailed Analysis:
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                  <div className="text-xs text-gray-700 leading-relaxed prose prose-xs max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        h1: ({ children }) => <h1 className="text-sm font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold mb-1">{children}</h3>,
                      }}
                    >
                      {estimate.rawApiResponse}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown */}
            {estimate.breakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Details:
                </h3>
                <div className="space-y-2">
                  {estimate.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-2 rounded-lg"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs text-yellow-800 leading-relaxed">
                <strong>Disclaimer:</strong> This is an estimate based on {isUsingAI ? 'AI analysis and' : ''} common nutritional values. 
                Actual calories may vary significantly based on preparation methods, portion sizes, and ingredients.
              </p>
            </div>
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
            For accurate nutritional information, consult restaurant nutrition guides
          </p>
        </div>
      </div>
    </div>
  );
}