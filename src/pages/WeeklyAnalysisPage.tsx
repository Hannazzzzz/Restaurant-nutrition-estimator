import React from 'react';
import { useAuth } from '../context/AuthContext';
import FoodHistory from '../components/FoodHistory';

export default function WeeklyAnalysisPage() {
  const { username } = useAuth();

  return (
    <div className="canopy-theme min-h-screen pt-20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            Weekly Analysis
          </h1>
          <p className="text-gray-300">
            Your nutrition insights and meal history for the past 7 days
          </p>
        </div>

        {/* Food History Component */}
        <FoodHistory userId={username || undefined} />
      </div>
    </div>
  );
}