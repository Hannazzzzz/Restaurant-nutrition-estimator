import React from 'react';
import { Heart, Target, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pt-20 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-semibold text-gray-900 mb-4">
            About canøpy
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered restaurant nutrition estimator
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-emerald-600" />
              Why I Built This
            </h2>
            
            <p className="text-gray-700 mb-6">
              Traditional calorie tracking apps work great for packaged foods and chain restaurants, 
              but they fall short when it comes to independent restaurants, ethnic cuisines, and 
              local establishments. I found myself constantly frustrated trying to estimate calories 
              for my favorite local spots.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-600" />
              The Solution
            </h2>
            
            <p className="text-gray-700 mb-6">
              canøpy uses AI to analyze restaurant dishes by researching actual menus, ingredients, 
              and preparation methods. Instead of generic estimates, you get informed calculations 
              based on real restaurant data and typical portion sizes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-600" />
              How It Works
            </h2>
            
            <ul className="text-gray-700 space-y-2 mb-6">
              <li>• <strong>Restaurant Discovery:</strong> AI searches for your specific restaurant and menu item</li>
              <li>• <strong>Ingredient Analysis:</strong> Breaks down dishes into components with realistic portions</li>
              <li>• <strong>Modification Detection:</strong> Accounts for customizations like "no cheese" or "extra sauce"</li>
              <li>• <strong>Weekly Insights:</strong> Track patterns and get meaningful analytics</li>
            </ul>

            <div className="bg-emerald-50 rounded-xl p-6 mt-8">
              <p className="text-emerald-800 text-center font-medium">
                Built during a 25-day hackathon challenge using Bolt.new, React, and AI APIs
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for your personal text */}
        <div className="bg-blue-50 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            About the Creator
          </h2>
          <p className="text-gray-700 italic">
            [Your personal background text will go here - please provide the final text 
            you'd like to include about yourself and your motivation for building this project]
          </p>
        </div>
      </div>
    </div>
  );
}