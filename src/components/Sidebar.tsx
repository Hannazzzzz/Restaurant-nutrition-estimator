import React from 'react';
import { Link } from 'react-router-dom';
import { X, TrendingUp, Info, Play } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Check for demo mode
  const isDemoMode = window.location.search.includes('demo=true');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-emerald-900/95 to-teal-900/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-white/10 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <h2 className="text-xl font-playfair font-semibold text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="p-6 bg-yellow-500/20 border-b border-yellow-400/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-600/30 rounded-full flex items-center justify-center border border-yellow-400/30">
                  <Play className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm text-yellow-200">Demo Mode Active</p>
                  <p className="font-medium text-yellow-100">Viewing sample data</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-6">
            <ul className="space-y-3">
              {/* Weekly Analysis */}
              <li>
                <Link
                  to="/weekly-analysis"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Weekly Analysis</span>
                </Link>
              </li>

              {/* About */}
              <li>
                <Link
                  to="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <Info className="w-5 h-5" />
                  <span className="font-medium">About</span>
                </Link>
              </li>

              {/* Demo Mode Toggle */}
              <li>
                <a
                  href={isDemoMode ? "/" : "/?demo=true"}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <Play className="w-5 h-5" />
                  <span className="font-medium">
                    {isDemoMode ? 'Exit Demo Mode' : 'Try Demo Mode'}
                  </span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Decorative Elements */}
          <div className="relative px-6 py-4">
            {/* Small decorative leaves */}
            <div className="absolute top-2 left-8 w-4 h-3 bg-emerald-400/30 rounded-full transform rotate-12"></div>
            <div className="absolute top-6 right-12 w-3 h-2 bg-teal-400/30 rounded-full transform -rotate-6"></div>
            <div className="absolute bottom-8 left-12 w-5 h-3 bg-emerald-500/20 rounded-full transform rotate-45"></div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20 bg-white/5">
            <div className="text-center">
              <p className="text-sm font-playfair text-emerald-200 mb-1">
                canøpy
              </p>
              <p className="text-xs text-gray-400">
                Restaurant Nutrition Estimator
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}