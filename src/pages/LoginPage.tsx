import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) return;
    
    setIsLoading(true);
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      login(username.trim());
      setIsLoading(false);
      navigate('/');
    }, 500);
  };

  const handleFindExisting = () => {
    // For now, this does the same as login since we're using localStorage
    // In a real app, this might search for existing usernames
    if (username.trim()) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <div className="canopy-theme min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4 border border-white/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            Welcome to canøpy
          </h1>
          <p className="text-gray-300">
            Enter your username to start tracking your restaurant meals
          </p>
        </div>

        {/* Login Form */}
        <div className="canopy-content rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-200 focus:border-yellow-200 transition-colors duration-200"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={!username.trim() || isLoading}
                className="w-full bg-white/10 hover:bg-white/20 disabled:bg-gray-500/20 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFindExisting}
                disabled={!username.trim() || isLoading}
                className="w-full bg-white/10 hover:bg-white/20 disabled:bg-gray-500/20 disabled:cursor-not-allowed text-gray-300 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-white/20"
              >
                Find Existing Account
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
            <p className="text-sm text-gray-300">
              <strong>Note:</strong> Your username is stored locally on this device. 
              You can use any username you like - no password required for this demo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            AI-powered restaurant nutrition analysis
          </p>
        </div>
      </div>
    </div>
  );
}