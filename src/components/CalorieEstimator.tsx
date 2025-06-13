import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calculator, Utensils, TrendingUp, AlertCircle, Wifi, WifiOff, Database, TestTube, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { testSupabaseConnection, supabase } from '../lib/supabase';
import { RestaurantDiscoveryResult } from '../types';
import FoodHistory from './FoodHistory';

export default function CalorieEstimator() {
  const [userInput, setUserInput] = useState('');
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

  // Input validation function
  function validateMealInput(input: string) {
    const trimmedInput = input.trim();
    
    // Check for 'from' or 'at' keyword
    if (!trimmedInput.toLowerCase().includes(' from ') && 
        !trimmedInput.toLowerCase().includes(' at ')) {
      return {
        valid: false,
        error: "Please end your description with 'from' or 'at' [restaurant name]",
        suggestion: "Example: 'Cortado from Baryl' or 'Pasta at Il Buco'"
      };
    }
    
    // Check minimum length
    if (trimmedInput.length < 10) {
      return {
        valid: false,
        error: "Please provide more details about your meal",
        suggestion: "Include the food item and restaurant name"
      };
    }
    
    return { valid: true };
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
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setDiscoveryResult(null);
    
    // Validate input format first
    const validation = validateMealInput(userInput);
    if (!validation.valid) {
      setError(validation.error);
      setDiscoveryResult({
        restaurant: 'Unknown',
        menuItem: 'Unknown',
        description: 'None listed',
        found: false,
        error: validation.error,
        suggestion: validation.suggestion,
        rawResponse: '',
        estimatedCalories: 'Input validation failed',
        inputFormat: true
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Phase 1: Restaurant Discovery + Phase 2: Dish Analysis
      const result = await estimateCalories(userInput);
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
            Restaurant Nutrition Estimator
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Phase 1 & 2: Restaurant discovery + complete dish analysis
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
        <div className="input-section bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label htmlFor="meal-input" className="input-label">
            Describe your meal
          </label>
          <textarea
            id="meal-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your meal, ending with 'from' or 'at' [restaurant name]

Examples:
• Cortado from Baryl Frederiksberg
• Avocado toast at Halifax Copenhagen  
• Lasagna from Il Buco
• Pad thai with chicken at Thai Kitchen Nørrebro"
            className="meal-input"
            disabled={isLoading}
            rows={4}
          />
          
          {/* Input format helper */}
          <div className="format-help">
            <span className="format-icon">💡</span>
            <span className="format-text">
              End with "from" or "at" [restaurant name] for best results
            </span>
          </div>
          
          <button
            onClick={handleEstimate}
            disabled={!userInput.trim() || isLoading}
            className="estimate-button w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing dish...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Analyze Meal
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && discoveryResult && (
          <div className="error-container bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            {discoveryResult.inputFormat ? (
              <div className="input-format-error">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <h3 className="font-medium text-sm">📝 Input Format Issue</h3>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
                {discoveryResult.suggestion && (
                  <p className="suggestion text-red-600 text-xs mt-2">💡 {discoveryResult.suggestion}</p>
                )}
              </div>
            ) : (
              <div className="api-error">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-sm">❌ Restaurant Not Found</h3>
                    <p className="text-xs mt-1">{error}</p>
                    {discoveryResult.suggestion && (
                      <p className="suggestion text-red-600 text-xs mt-2">💡 {discoveryResult.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Restaurant Discovery Results */}
        {discoveryResult && !discoveryResult.inputFormat && (
          <div className="results-container">
            {discoveryResult.found ? (
              <>
                {/* Phase 1 Results */}
                <div className="phase-result phase-1 bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      🏪 Restaurant Found (Phase 1)
                    </h2>
                  </div>

                  <div className="space-y-4">
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
                </div>

                {/* Phase 2 Results */}
                {discoveryResult.phase && discoveryResult.phase >= 2 && (
                  <div className="phase-result phase-2 bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                        <Utensils className="w-6 h-6 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        🍽️ Complete Dish Analysis (Phase 2)
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {discoveryResult.dishComponents && (
                        <div className="dish-components">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Complete Ingredients:</h4>
                          <pre className="components-list">{discoveryResult.dishComponents}</pre>
                        </div>
                      )}

                      {discoveryResult.portionReasoning && (
                        <div className="portion-reasoning">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Portion Size Reasoning:</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{discoveryResult.portionReasoning}</p>
                        </div>
                      )}

                      {discoveryResult.standardCalories && (
                        <div className="calorie-total">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Standard Menu Calories:</h4>
                          <p className="calorie-number">{discoveryResult.standardCalories} calories</p>
                        </div>
                      )}

                      {discoveryResult.ready && (
                        <div className="next-phase">
                          <p className="text-green-700 text-sm font-medium">
                            ✅ {discoveryResult.ready}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="restaurant-not-found bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
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

            {/* Debug section */}
            {(discoveryResult.rawResponse || discoveryResult.rawResponses) && (
              <details className="debug-section bg-white rounded-2xl shadow-lg p-6 mb-6">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                  Show AI Responses (Debug)
                </summary>
                {discoveryResult.rawResponses ? (
                  <div className="raw-responses space-y-4">
                    <div className="phase-response">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Phase 1 (Restaurant Discovery):</h4>
                      <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                        {discoveryResult.rawResponses.phase1}
                      </pre>
                    </div>
                    <div className="phase-response">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Phase 2 (Dish Analysis):</h4>
                      <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                        {discoveryResult.rawResponses.phase2}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {discoveryResult.rawResponse}
                    </pre>
                  </div>
                )}
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
            Phase 1 & 2: Restaurant Discovery + Dish Analysis • Phase 3 coming soon
          </p>
        </div>
      </div>
    </div>
  );
}