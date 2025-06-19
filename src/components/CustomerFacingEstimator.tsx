import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { getUserId } from '../utils/userUtils';

export default function CustomerFacingEstimator() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Use the centralized estimateCalories function
      const result = await estimateCalories(userInput, true);
      
      // Show success state
      setShowSuccess(true);
      setUserInput('');
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Estimation failed:', error);
      // In customer-facing UI, we don't show detailed errors
      // Just reset the loading state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 relative">
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

      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe your meal..."
              className="w-full h-32 px-6 py-4 pr-16 text-lg border-2 border-gray-200 rounded-2xl shadow-lg resize-none focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 placeholder-gray-400"
              disabled={isLoading}
              rows={3}
            />
            
            {/* Go Button */}
            <button
              type="submit"
              disabled={!userInput.trim() || isLoading}
              className="absolute bottom-4 right-4 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : showSuccess ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              )}
            </button>
          </div>
          
          {/* Success State */}
          {showSuccess && (
            <div className="absolute inset-0 bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-3">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-emerald-700 font-medium">Meal logged successfully!</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}