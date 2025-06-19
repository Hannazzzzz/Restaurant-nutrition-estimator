import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { estimateCalories } from '../utils/calorieEstimator';
import { getUserId } from '../utils/userUtils';

export default function CustomerFacingEstimator() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

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

  // Generate random leaf properties for the wall
  const generateRandomLeaf = (index: number) => {
    const shapes = ['leaf-shape-1', 'leaf-shape-2', 'leaf-shape-3', 'leaf-shape-4', 'leaf-shape-5', 'leaf-shape-6'];
    const colors = ['leaf-color-1', 'leaf-color-2', 'leaf-color-3', 'leaf-color-4', 'leaf-color-5', 'leaf-color-6', 'leaf-color-7'];
    const sizes = ['leaf-size-tiny', 'leaf-size-small', 'leaf-size-medium', 'leaf-size-large', 'leaf-size-extra-large'];
    
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
    // Random positioning and styling
    const left = Math.random() * 100; // 0-100%
    const bottom = Math.random() * 180; // 0-180px from bottom
    const rotation = Math.random() * 360; // 0-360 degrees
    const opacity = 0.4 + Math.random() * 0.4; // 0.4-0.8
    const zIndex = Math.floor(Math.random() * 5) + 1; // 1-5
    
    return {
      shape,
      color,
      size,
      style: {
        left: `${left}%`,
        bottom: `${bottom}px`,
        transform: `rotate(${rotation}deg)`,
        opacity: opacity,
        zIndex: zIndex
      }
    };
  };

  // Generate 90 leaves for the dense wall
  const wallLeaves = Array.from({ length: 90 }, (_, index) => generateRandomLeaf(index));

  return (
    <div className={`canopy-theme ${isInputFocused ? 'input-focused' : ''}`}>
      {/* Strategic Large Leaves - Framing the Interface */}
      
      {/* Left Side Framing - 2 Large Leaves */}
      <div className="leaf-decoration leaf-shape-1 leaf-color-1 leaf-size-giant leaf-frame-left-1" style={{ transform: 'rotate(25deg)' }}></div>
      <div className="leaf-decoration leaf-shape-3 leaf-color-3 leaf-size-huge leaf-frame-left-2" style={{ transform: 'rotate(45deg)' }}></div>
      
      {/* Right Side Framing - 3 Large Leaves */}
      <div className="leaf-decoration leaf-shape-2 leaf-color-2 leaf-size-giant leaf-frame-right-1" style={{ transform: 'rotate(-15deg)' }}></div>
      <div className="leaf-decoration leaf-shape-4 leaf-color-4 leaf-size-huge leaf-frame-right-2" style={{ transform: 'rotate(-25deg)' }}></div>
      <div className="leaf-decoration leaf-shape-6 leaf-color-6 leaf-size-giant leaf-frame-right-3" style={{ transform: 'rotate(-35deg)' }}></div>
      
      {/* Bottom Edge - 3-5 Leaves */}
      <div className="leaf-decoration leaf-shape-5 leaf-color-5 leaf-size-extra-large leaf-frame-bottom-1" style={{ transform: 'rotate(35deg)' }}></div>
      <div className="leaf-decoration leaf-shape-2 leaf-color-7 leaf-size-large leaf-frame-bottom-2" style={{ transform: 'rotate(55deg)' }}></div>
      <div className="leaf-decoration leaf-shape-1 leaf-color-1 leaf-size-extra-large leaf-frame-bottom-3" style={{ transform: 'rotate(-45deg)' }}></div>
      <div className="leaf-decoration leaf-shape-4 leaf-color-3 leaf-size-large leaf-frame-bottom-4" style={{ transform: 'rotate(-55deg)' }}></div>
      <div className="leaf-decoration leaf-shape-3 leaf-color-5 leaf-size-extra-large leaf-frame-bottom-5" style={{ transform: 'rotate(65deg)' }}></div>
      
      {/* Top Hanging - 1-2 Smaller Leaves */}
      <div className="leaf-decoration leaf-shape-6 leaf-color-2 leaf-size-medium leaf-frame-top-1" style={{ transform: 'rotate(75deg)' }}></div>
      <div className="leaf-decoration leaf-shape-1 leaf-color-6 leaf-size-small leaf-frame-top-2" style={{ transform: 'rotate(-75deg)' }}></div>
      
      {/* Fill Leaves - Smaller leaves around the larger framing ones */}
      <div className="leaf-decoration leaf-shape-2 leaf-color-1 leaf-size-small leaf-fill-1" style={{ transform: 'rotate(85deg)' }}></div>
      <div className="leaf-decoration leaf-shape-4 leaf-color-3 leaf-size-medium leaf-fill-2" style={{ transform: 'rotate(-85deg)' }}></div>
      <div className="leaf-decoration leaf-shape-5 leaf-color-5 leaf-size-tiny leaf-fill-3" style={{ transform: 'rotate(95deg)' }}></div>
      <div className="leaf-decoration leaf-shape-6 leaf-color-2 leaf-size-small leaf-fill-4" style={{ transform: 'rotate(-95deg)' }}></div>
      <div className="leaf-decoration leaf-shape-1 leaf-color-4 leaf-size-medium leaf-fill-5" style={{ transform: 'rotate(105deg)' }}></div>
      <div className="leaf-decoration leaf-shape-3 leaf-color-7 leaf-size-tiny leaf-fill-6" style={{ transform: 'rotate(-105deg)' }}></div>
      <div className="leaf-decoration leaf-shape-2 leaf-color-6 leaf-size-small leaf-fill-7" style={{ transform: 'rotate(115deg)' }}></div>
      <div className="leaf-decoration leaf-shape-4 leaf-color-1 leaf-size-medium leaf-fill-8" style={{ transform: 'rotate(-115deg)' }}></div>
      
      {/* Subtle Overlapping Leaves - These will move slightly when input is focused */}
      <div className="leaf-decoration leaf-shape-5 leaf-color-3 leaf-size-large leaf-overlap-input-slight" style={{ top: '40%', left: '15%', transform: 'rotate(20deg)' }}></div>
      <div className="leaf-decoration leaf-shape-1 leaf-color-5 leaf-size-medium leaf-overlap-input-slight" style={{ top: '55%', right: '20%', transform: 'rotate(-30deg)' }}></div>
      
      {/* Dense Wall of Leaves at Bottom - 90 randomly generated leaves (static) */}
      <div className="leaf-wall-container">
        {wallLeaves.map((leaf, index) => (
          <div
            key={index}
            className={`leaf-decoration leaf-wall-item ${leaf.shape} ${leaf.color} ${leaf.size}`}
            style={leaf.style}
          ></div>
        ))}
      </div>
      
      {/* Fireflies - Much slower movement */}
      <div className="firefly firefly-1"></div>
      <div className="firefly firefly-2"></div>
      <div className="firefly firefly-3"></div>
      <div className="firefly firefly-4"></div>
      <div className="firefly firefly-5"></div>
      <div className="firefly firefly-6"></div>
      <div className="firefly firefly-7"></div>
      <div className="firefly firefly-8"></div>
      
      {/* Light Beams - Very subtle and static */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      
      {/* Tropical Flowers - Keep them */}
      <div className="flower-decoration flower-1"></div>
      <div className="flower-decoration flower-2"></div>
      <div className="flower-decoration flower-3"></div>
      <div className="flower-decoration flower-4"></div>
      <div className="flower-decoration flower-5"></div>
      <div className="flower-decoration flower-6"></div>
      <div className="flower-decoration flower-7"></div>
      <div className="flower-decoration flower-8"></div>
      <div className="flower-decoration flower-9"></div>
      <div className="flower-decoration flower-10"></div>

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
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
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