import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { getUserId } from '../utils/userUtils';

export default function SciFiEstimator() {
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
    <div className="sci-fi-theme">
      {/* Sci-Fi Fireflies - Enhanced with blue/cyan glow */}
      <div className="sci-fi-firefly sci-fi-firefly-1" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-2" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-3" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-4" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-5" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-6" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-7" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-8" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-9" style={{ zIndex: 3 }}></div>
      <div className="sci-fi-firefly sci-fi-firefly-10" style={{ zIndex: 3 }}></div>

      {/* Sci-Fi Light Beams - Thin and glowing */}
      <div className="sci-fi-light-beam sci-fi-beam-1"></div>
      <div className="sci-fi-light-beam sci-fi-beam-2"></div>
      <div className="sci-fi-light-beam sci-fi-beam-3"></div>
      <div className="sci-fi-light-beam sci-fi-beam-4"></div>
      <div className="sci-fi-light-beam sci-fi-beam-5"></div>
      <div className="sci-fi-light-beam sci-fi-beam-6"></div>

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
            <h1 className="sci-fi-title text-5xl md:text-6xl mb-4">
              canøpy
            </h1>
            <p className="font-montserrat text-cyan-300/80 text-lg font-light">
              Your restaurant nutrition estimator
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="input-sci-fi-wrapper">
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Describe your meal..."
                  className="sci-fi-input w-full h-32 px-6 py-4 pr-16 text-lg rounded-2xl resize-none font-montserrat placeholder-cyan-400/50 transition-all duration-300"
                  disabled={isLoading}
                  rows={3}
                />
                
                {/* Go Button */}
                <button
                  type="submit"
                  disabled={!userInput.trim() || isLoading}
                  className="sci-fi-button absolute bottom-4 right-4 w-12 h-12 text-cyan-300 rounded-xl flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : showSuccess ? (
                    <Check className="w-5 h-5 text-cyan-300" />
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
                        strokeWidth={1} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6" 
                      />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Success State */}
              {showSuccess && (
                <div className="sci-fi-success absolute inset-0 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-3 backdrop-blur-sm border border-cyan-400/30">
                      <Check className="w-8 h-8 text-cyan-300" />
                    </div>
                    <p className="text-cyan-300 font-montserrat font-light">Meal logged successfully!</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}