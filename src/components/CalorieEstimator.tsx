import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calculator, Utensils, TrendingUp, AlertCircle, Database, MapPin, CheckCircle, XCircle, Edit3, Zap, Search, Brain } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { testSupabaseConnection, supabase } from '../lib/supabase';
import { testGoogleSearch } from '../utils/googleSearchApi';
import { testPerplexityAPI } from '../utils/perplexityApi';
import { getUserId } from '../utils/userUtils';
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
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string; results?: any[] } | null>(null);
  const [isTestingGoogle, setIsTestingGoogle] = useState(false);
  const [perplexityTestResult, setPerplexityTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);
  const [isTestingPerplexity, setIsTestingPerplexity] = useState(false);

  // Test database connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setDbStatus(result);
    };
    
    testConnection();
  }, []);

  // Updated input validation function - now more flexible
  function validateMealInput(input: string) {
    const trimmedInput = input.trim();
    
    // Check minimum length
    if (trimmedInput.length < 5) {
      return {
        valid: false,
        error: "Please provide more details about your meal",
        suggestion: "Include the food item and restaurant name"
      };
    }
    
    // Check for obvious non-food inputs
    if (trimmedInput.length < 3 || /^[0-9]+$/.test(trimmedInput)) {
      return {
        valid: false,
        error: "Please describe a food item or meal",
        suggestion: "Example: 'Big Mac from McDonald's' or 'Margherita pizza'"
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

  // Test function for Google Search API
  const runGoogleSearchTest = async () => {
    setIsTestingGoogle(true);
    setGoogleTestResult(null);
    
    try {
      console.log('Testing Google Custom Search API...');
      const result = await testGoogleSearch();
      setGoogleTestResult(result);
    } catch (err) {
      console.error('Google Search test failed:', err);
      setGoogleTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestingGoogle(false);
    }
  };

  // Test function for Perplexity API
  const runPerplexityTest = async () => {
    setIsTestingPerplexity(true);
    setPerplexityTestResult(null);
    
    try {
      console.log('Testing Perplexity API...');
      const result = await testPerplexityAPI();
      setPerplexityTestResult(result);
    } catch (err) {
      console.error('Perplexity API test failed:', err);
      setPerplexityTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestingPerplexity(false);
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
      // Always use AI mode (Perplexity API)
      const result = await estimateCalories(userInput, true);
      setDiscoveryResult(result);
      
      if (result.error) {
        setError(result.error);
      }
      
      // Refresh food history if meal was saved
      if (result.saved) {
        setHistoryRefreshTrigger(prev => prev + 1);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('AI estimation error:', err);
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-4">
            <p className="text-xs text-yellow-700">
              🔧 Debug Mode - <a href="/" className="underline hover:text-yellow-800">Switch to Customer UI</a>
            </p>
          </div>
        </div>

        {/* API Testing Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            API Connection Tests
          </h3>
          
          <div className="space-y-3">
            {/* Database Test */}
            <div>
              <button
                onClick={runFoodEntriesTest}
                disabled={isTestingFoodEntries}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-2"
              >
                {isTestingFoodEntries ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Test Database Connection
                  </>
                )}
              </button>

              {foodEntriesTestResult && (
                <div className={`p-3 rounded-xl border ${
                  foodEntriesTestResult.success 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {foodEntriesTestResult.success ? '✅ Database Test Passed' : '❌ Database Test Failed'}
                    </span>
                  </div>
                  {foodEntriesTestResult.message && (
                    <p className="text-xs mt-1">{foodEntriesTestResult.message}</p>
                  )}
                  {foodEntriesTestResult.error && (
                    <p className="text-xs mt-1 opacity-75">{foodEntriesTestResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Perplexity API Test */}
            <div>
              <button
                onClick={runPerplexityTest}
                disabled={isTestingPerplexity}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-2"
              >
                {isTestingPerplexity ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing Perplexity AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Test Perplexity API
                  </>
                )}
              </button>

              {perplexityTestResult && (
                <div className={`p-3 rounded-xl border ${
                  perplexityTestResult.success 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {perplexityTestResult.success ? '✅ Perplexity API Test Passed' : '❌ Perplexity API Test Failed'}
                    </span>
                  </div>
                  <p className="text-xs mt-1">{perplexityTestResult.message}</p>
                  {perplexityTestResult.response && (
                    <div className="text-xs mt-2 bg-white bg-opacity-50 p-2 rounded">
                      <strong>Sample response:</strong> {perplexityTestResult.response.substring(0, 100)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Search Test */}
            <div>
              <button
                onClick={runGoogleSearchTest}
                disabled={isTestingGoogle}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-2"
              >
                {isTestingGoogle ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing Google Search...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Test Google Search API
                  </>
                )}
              </button>

              {googleTestResult && (
                <div className={`p-3 rounded-xl border ${
                  googleTestResult.success 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {googleTestResult.success ? '✅ Google Search Test Passed' : '❌ Google Search Test Failed'}
                    </span>
                  </div>
                  <p className="text-xs mt-1">{googleTestResult.message}</p>
                  {googleTestResult.results && googleTestResult.results.length > 0 && (
                    <div className="text-xs mt-2 bg-white bg-opacity-50 p-2 rounded">
                      <strong>Sample result:</strong> {googleTestResult.results[0].title}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
            placeholder="Describe any meal or food item:

Examples:
• Big Mac from McDonald's
• Margherita pizza from Tony's
• Cortado from Baryl Frederiksberg
• Avocado toast at Halifax Copenhagen  
• Chicken tikka masala
• Large fries
• Chocolate croissant"
            className="meal-input"
            disabled={isLoading}
            rows={4}
          />
          
          <button
            onClick={handleEstimate}
            disabled={!userInput.trim() || isLoading}
            className="estimate-button w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing with AI...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                Analyze with AI
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
                  <h3 className="font-medium text-sm">📝 Input Issue</h3>
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
                    <h3 className="font-medium text-sm">❌ AI Analysis Failed</h3>
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

        {/* Simple Results Display */}
        {discoveryResult && !discoveryResult.inputFormat && discoveryResult.found && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Analysis Complete
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

              <div className="final-result">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Estimated Calories:</h4>
                <p className="final-calories">{discoveryResult.finalCalories} calories</p>
                <p className="text-xs text-blue-600 mt-1">Confidence: {discoveryResult.confidence}</p>
              </div>
            </div>

            {/* Database Save Status */}
            <div className="mt-4">
              {discoveryResult.saved ? (
                <div className="save-success">
                  <p className="text-sm font-medium">✅ Saved to your food log</p>
                </div>
              ) : discoveryResult.saveError ? (
                <div className="save-error">
                  <p className="text-sm font-medium">❌ Save failed: {discoveryResult.saveError}</p>
                </div>
              ) : null}
            </div>

            {/* Debug section */}
            {(discoveryResult.rawResponse || discoveryResult.rawResponses) && (
              <details className="mt-6">
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
                    {discoveryResult.rawResponses.phase3 && (
                      <div className="phase-response">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Phase 3 (Modifications):</h4>
                        <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {discoveryResult.rawResponses.phase3}
                        </pre>
                      </div>
                    )}
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

        {/* Failed Analysis Display */}
        {discoveryResult && !discoveryResult.inputFormat && !discoveryResult.found && (
          <div className="restaurant-not-found bg-white rounded-2xl shadow-lg p-6 mb-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ❌ AI Analysis Failed
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
            AI-powered restaurant nutrition analysis
          </p>
        </div>
      </div>
    </div>
  );
}