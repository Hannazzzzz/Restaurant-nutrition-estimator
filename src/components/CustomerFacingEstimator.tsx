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
    <div className="canopy-theme">
      {/* Decorative Leaves */}
      <div className="leaf-decoration large leaf-top-left"></div>
      <div className="leaf-decoration medium leaf-top-right"></div>
      <div className="leaf-decoration large leaf-bottom-left"></div>
      <div className="leaf-decoration medium leaf-bottom-right"></div>
      <div className="leaf-decoration small leaf-mid-left"></div>
      <div className="leaf-decoration small leaf-mid-right"></div>
      
      {/* Fireflies */}
      <div className="firefly firefly-1"></div>
      <div className="firefly firefly-2"></div>
      <div className="firefly firefly-3"></div>
      <div className="firefly firefly-4"></div>
      <div className="firefly firefly-5"></div>
      <div className="firefly firefly-6"></div>
      <div className="firefly firefly-7"></div>
      <div className="firefly firefly-8"></div>
      
      {/* Light Beams */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      
      {/* Tropical Flowers */}
      <div className="flower-decoration flower-1"></div>
      <div className="flower-decoration flower-2"></div>
      <div className="flower-decoration flower-3"></div>
      <div className="flower-decoration flower-4"></div>
      <div className="flower-decoration flower-5"></div>

      {/* Built with Bolt Badge */}
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-20 hover:scale-105 transition-transform duration-200"
      >
        <img
          src="/black_circle_360x360.png"
          alt="Built with Bolt"
          className="w-12 h-12 md:w-16 md:h-16"
        />
      </a>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="canopy-title text-5xl md:text-6xl mb-4">
              canøpy
            </h1>
            <p className="font-montserrat text-white/80 text-lg font-light">
              Your restaurant nutrition estimator
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="input-jungle-wrapper">
              {/* Plant Decorations */}
              <div className="plant-decoration vine-left"></div>
              <div className="plant-decoration vine-right"></div>
              <div className="plant-decoration moss-bottom"></div>
              <div className="plant-decoration small-leaf-1"></div>
              <div className="plant-decoration small-leaf-2"></div>
              
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Describe your meal..."
                  className="canopy-input w-full h-32 px-6 py-4 pr-16 text-lg rounded-2xl resize-none font-montserrat placeholder-gray-500 transition-all duration-300"
                  disabled={isLoading}
                  rows={3}
                />
                
                {/* Go Button */}
                <button
                  type="submit"
                  disabled={!userInput.trim() || isLoading}
                  className="canopy-button absolute bottom-4 right-4 w-12 h-12 text-white rounded-xl flex items-center justify-center"
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
                <div className="canopy-success absolute inset-0 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                      <Check className="w-8 h-8 text-green-700" />
                    </div>
                    <p className="text-green-800 font-montserrat font-medium">Meal logged successfully!</p>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Subtle Instructions */}
          <div className="text-center mt-8">
            <p className="font-montserrat text-white/60 text-sm">
              Try: "Big Mac from McDonald's" or "Margherita pizza"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}