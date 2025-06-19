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
      {/* Strategic Large Leaves - Clean Framing (STATIC) - Random rotation ±20° */}
      {/* Left Side - 2 massive leaves */}
      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-1 leaf-size-giant" 
        style={{ 
          position: 'fixed',
          left: '-100px',
          top: '20%',
          width: '300px',
          height: '200px',
          transform: 'rotate(8deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-3 leaf-size-huge" 
        style={{ 
          position: 'fixed',
          left: '-80px',
          bottom: '30%',
          width: '250px',
          height: '180px',
          transform: 'rotate(-12deg)',
          zIndex: 1
        }}
      ></div>

      {/* Right Side - 2 massive leaves */}
      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-2 leaf-size-giant" 
        style={{ 
          position: 'fixed',
          right: '-100px',
          top: '20%',
          width: '300px',
          height: '200px',
          transform: 'rotate(-7deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-4 leaf-size-huge" 
        style={{ 
          position: 'fixed',
          right: '-80px',
          bottom: '25%',
          width: '250px',
          height: '180px',
          transform: 'rotate(14deg)',
          zIndex: 1
        }}
      ></div>

      {/* Bottom leaves - partial overlap */}
      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-5 leaf-size-extra-large" 
        style={{ 
          position: 'fixed',
          bottom: '-50px',
          left: '20%',
          width: '200px',
          height: '150px',
          transform: 'rotate(-9deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-6 leaf-size-extra-large" 
        style={{ 
          position: 'fixed',
          bottom: '-50px',
          right: '20%',
          width: '200px',
          height: '150px',
          transform: 'rotate(11deg)',
          zIndex: 1
        }}
      ></div>

      {/* Additional Random Jungle Leaves - Different Sizes - Random rotation ±20° */}
      {/* Top hanging leaves - avoid title area (center 40%) */}
      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-2 leaf-size-small" 
        style={{ 
          position: 'fixed',
          top: '-20px',
          left: '15%',
          width: '70px',
          height: '50px',
          transform: 'rotate(-16deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-4 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          top: '-30px',
          right: '15%',
          width: '100px',
          height: '70px',
          transform: 'rotate(19deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-1 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          top: '-15px',
          left: '8%',
          width: '40px',
          height: '28px',
          transform: 'rotate(-5deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-6 leaf-size-small" 
        style={{ 
          position: 'fixed',
          top: '-25px',
          right: '8%',
          width: '70px',
          height: '50px',
          transform: 'rotate(13deg)',
          zIndex: 1
        }}
      ></div>

      {/* Mid-level scattered leaves */}
      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-3 leaf-size-large" 
        style={{ 
          position: 'fixed',
          left: '5%',
          top: '45%',
          width: '150px',
          height: '105px',
          transform: 'rotate(-18deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-7 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          right: '8%',
          top: '55%',
          width: '100px',
          height: '70px',
          transform: 'rotate(6deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-5 leaf-size-small" 
        style={{ 
          position: 'fixed',
          left: '15%',
          top: '65%',
          width: '70px',
          height: '50px',
          transform: 'rotate(17deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-2 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          right: '12%',
          top: '35%',
          width: '100px',
          height: '70px',
          transform: 'rotate(-10deg)',
          zIndex: 1
        }}
      ></div>

      {/* Corner accent leaves */}
      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-4 leaf-size-large" 
        style={{ 
          position: 'fixed',
          left: '-30px',
          top: '5%',
          width: '150px',
          height: '105px',
          transform: 'rotate(4deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-1 leaf-size-large" 
        style={{ 
          position: 'fixed',
          right: '-30px',
          top: '8%',
          width: '150px',
          height: '105px',
          transform: 'rotate(-15deg)',
          zIndex: 1
        }}
      ></div>

      {/* COMPLETELY FILLED Lower Corner Leaves - Left Side */}
      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-3 leaf-size-large" 
        style={{ 
          position: 'fixed',
          bottom: '5%',
          left: '2%',
          width: '150px',
          height: '105px',
          transform: 'rotate(9deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-5 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '8%',
          left: '8%',
          width: '100px',
          height: '70px',
          transform: 'rotate(-14deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-1 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '12%',
          left: '5%',
          width: '70px',
          height: '50px',
          transform: 'rotate(18deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-7 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          bottom: '15%',
          left: '12%',
          width: '40px',
          height: '28px',
          transform: 'rotate(-3deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-2 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '3%',
          left: '15%',
          width: '100px',
          height: '70px',
          transform: 'rotate(12deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-4 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '18%',
          left: '3%',
          width: '70px',
          height: '50px',
          transform: 'rotate(-20deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-6 leaf-size-large" 
        style={{ 
          position: 'fixed',
          bottom: '1%',
          left: '25%',
          width: '150px',
          height: '105px',
          transform: 'rotate(7deg)',
          zIndex: 1
        }}
      ></div>

      {/* Additional left corner fill */}
      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-3 leaf-size-extra-large" 
        style={{ 
          position: 'fixed',
          bottom: '0%',
          left: '0%',
          width: '200px',
          height: '140px',
          transform: 'rotate(-11deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-5 leaf-size-huge" 
        style={{ 
          position: 'fixed',
          bottom: '10%',
          left: '0%',
          width: '250px',
          height: '175px',
          transform: 'rotate(16deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-1 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '20%',
          left: '1%',
          width: '100px',
          height: '70px',
          transform: 'rotate(-8deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-7 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '25%',
          left: '6%',
          width: '70px',
          height: '50px',
          transform: 'rotate(15deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-2 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          bottom: '30%',
          left: '4%',
          width: '40px',
          height: '28px',
          transform: 'rotate(-6deg)',
          zIndex: 1
        }}
      ></div>

      {/* COMPLETELY FILLED Lower Corner Leaves - Right Side */}
      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-1 leaf-size-large" 
        style={{ 
          position: 'fixed',
          bottom: '5%',
          right: '2%',
          width: '150px',
          height: '105px',
          transform: 'rotate(-9deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-3 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '8%',
          right: '8%',
          width: '100px',
          height: '70px',
          transform: 'rotate(14deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-5 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '12%',
          right: '5%',
          width: '70px',
          height: '50px',
          transform: 'rotate(-18deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-7 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          bottom: '15%',
          right: '12%',
          width: '40px',
          height: '28px',
          transform: 'rotate(3deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-2 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '3%',
          right: '15%',
          width: '100px',
          height: '70px',
          transform: 'rotate(-12deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-4 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '18%',
          right: '3%',
          width: '70px',
          height: '50px',
          transform: 'rotate(20deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-6 leaf-size-large" 
        style={{ 
          position: 'fixed',
          bottom: '1%',
          right: '25%',
          width: '150px',
          height: '105px',
          transform: 'rotate(-7deg)',
          zIndex: 1
        }}
      ></div>

      {/* Additional right corner fill */}
      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-1 leaf-size-extra-large" 
        style={{ 
          position: 'fixed',
          bottom: '0%',
          right: '0%',
          width: '200px',
          height: '140px',
          transform: 'rotate(11deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-3 leaf-size-huge" 
        style={{ 
          position: 'fixed',
          bottom: '10%',
          right: '0%',
          width: '250px',
          height: '175px',
          transform: 'rotate(-16deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-5 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '20%',
          right: '1%',
          width: '100px',
          height: '70px',
          transform: 'rotate(8deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-7 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '25%',
          right: '6%',
          width: '70px',
          height: '50px',
          transform: 'rotate(-15deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-2 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          bottom: '30%',
          right: '4%',
          width: '40px',
          height: '28px',
          transform: 'rotate(6deg)',
          zIndex: 1
        }}
      ></div>

      {/* Bottom scattered leaves - fill remaining gaps */}
      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-6 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '10%',
          left: '35%',
          width: '100px',
          height: '70px',
          transform: 'rotate(-13deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-3 leaf-size-medium" 
        style={{ 
          position: 'fixed',
          bottom: '15%',
          right: '40%',
          width: '100px',
          height: '70px',
          transform: 'rotate(10deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-1 leaf-color-7 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '5%',
          left: '45%',
          width: '70px',
          height: '50px',
          transform: 'rotate(5deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-3 leaf-color-5 leaf-size-small" 
        style={{ 
          position: 'fixed',
          bottom: '8%',
          right: '50%',
          width: '70px',
          height: '50px',
          transform: 'rotate(-19deg)',
          zIndex: 1
        }}
      ></div>

      {/* Fill gaps with tiny leaves */}
      <div 
        className="leaf-decoration leaf-shape-2 leaf-color-2 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          left: '30%',
          top: '25%',
          width: '40px',
          height: '28px',
          transform: 'rotate(-4deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-4 leaf-color-4 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          right: '25%',
          top: '75%',
          width: '40px',
          height: '28px',
          transform: 'rotate(11deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-5 leaf-color-1 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          left: '70%',
          top: '45%',
          width: '40px',
          height: '28px',
          transform: 'rotate(-17deg)',
          zIndex: 1
        }}
      ></div>

      <div 
        className="leaf-decoration leaf-shape-6 leaf-color-3 leaf-size-tiny" 
        style={{ 
          position: 'fixed',
          right: '65%',
          bottom: '35%',
          width: '40px',
          height: '28px',
          transform: 'rotate(14deg)',
          zIndex: 1
        }}
      ></div>

      {/* Enhanced fireflies with independent movement */}
      <div className="firefly firefly-1" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-2" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-3" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-4" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-5" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-6" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-7" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-8" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-9" style={{ zIndex: 3 }}></div>
      <div className="firefly firefly-10" style={{ zIndex: 3 }}></div>

      {/* More flowers scattered throughout */}
      <div className="flower-decoration" style={{ position: 'fixed', top: '25%', left: '15%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', bottom: '40%', right: '20%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', top: '70%', left: '80%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', top: '35%', right: '10%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', bottom: '60%', left: '25%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', top: '55%', right: '35%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', bottom: '20%', left: '60%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', top: '80%', right: '60%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', bottom: '75%', left: '40%', zIndex: 2, animation: 'none' }}></div>
      <div className="flower-decoration" style={{ position: 'fixed', top: '15%', left: '70%', zIndex: 2, animation: 'none' }}></div>

      {/* Enhanced light beams - subtle and static */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      <div className="light-beam beam-4"></div>

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
          {/* Title - Clear area, no elements behind */}
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
              {/* Plant Decorations - Only slight overlap */}
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
                  className="canopy-input w-full h-32 px-6 py-4 pr-16 text-lg rounded-2xl resize-none font-montserrat placeholder-white/70 transition-all duration-300"
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
        </div>
      </div>
    </div>
  );
}