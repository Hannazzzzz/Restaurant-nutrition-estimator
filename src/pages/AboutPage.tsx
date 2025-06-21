import React from 'react';
import { Heart, Target, Zap, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="canopy-theme min-h-screen pt-20 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-semibold text-white mb-4">
            About canøpy
          </h1>
          <p className="text-xl text-gray-300">
            Your AI-powered restaurant nutrition estimator
          </p>
        </div>

        {/* Personal Story */}
        <div className="canopy-content rounded-2xl p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-emerald-300" />
              Hey! I'm Hanna
            </h2>
            
            <p className="text-gray-200 mb-6">
              I built this as a fun experiment for the{' '}
              <a 
                href="https://worldslargesthackathon.devpost.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-300 hover:text-emerald-200 underline inline-flex items-center gap-1"
              >
                World's Largest Hackathon
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>

            <p className="text-gray-200 mb-6">
              I kept hearing people say they wanted to be aware of restaurant calories but hated traditional tracking apps - they felt too obsessive and medical. So I wondered: what if nutrition awareness could feel more like pushing through a jungle to find clarity?
            </p>

            <p className="text-gray-200 mb-6">
              Canøpy uses AI to estimate restaurant calories conversationally, with a psychology-first approach. It's not perfect (restaurant data is surprisingly tricky!), but it's designed for people who want mindful eating without the app anxiety.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-300" />
              The Psychology-First Approach
            </h2>
            
            <p className="text-gray-200 mb-6">
              Traditional nutrition apps look like medical software and often trigger obsessive behaviors. Canøpy feels organic and calming - like discovering hidden insights in a magical jungle canopy. The goal is mindful awareness, not anxious tracking.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-300" />
              How It Works
            </h2>
            
            <ul className="text-gray-200 space-y-2 mb-6">
              <li>• <strong>Restaurant Discovery:</strong> AI searches for your specific restaurant and menu item</li>
              <li>• <strong>Ingredient Analysis:</strong> Breaks down dishes into components with realistic portions</li>
              <li>• <strong>Modification Detection:</strong> Accounts for customizations like "no cheese" or "extra sauce"</li>
              <li>• <strong>Weekly Insights:</strong> Track patterns and get meaningful analytics</li>
            </ul>

            <div className="bg-white/10 rounded-xl p-6 mt-8 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">Want to follow the journey?</h3>
              <p className="text-gray-200 mb-4">
                I've documented the whole process at:
              </p>
              <div className="space-y-2">
                <a 
                  href="https://github.com/Hannazzzzz/Restaurant-nutrition-estimator/blob/main/README.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 underline inline-flex items-center gap-1 block"
                >
                  GitHub Repository & Development Log
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a 
                  href="https://hannazoon.wordpress.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 underline inline-flex items-center gap-1 block"
                >
                  hannazoon.wordpress.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="bg-emerald-900/20 rounded-xl p-6 mt-8 border border-emerald-500/30">
              <p className="text-emerald-200 text-center font-medium">
                Built with 🌿 in Copenhagen during June 2025
              </p>
              <p className="text-emerald-300 text-center text-sm mt-2">
                30-day hackathon challenge using Bolt.new, React, and AI APIs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}