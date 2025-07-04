import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  // Check for demo mode
  const isDemoMode = window.location.search.includes('demo=true');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-800/90 to-teal-800/90 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo/Title with Demo Mode Indicator */}
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="text-2xl font-playfair font-semibold text-yellow-200 hover:text-yellow-100 transition-colors duration-200"
          >
            canøpy
          </Link>
          {isDemoMode && (
            <span className="text-xs text-yellow-300/80 bg-yellow-500/20 px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </div>

        {/* Built with Bolt Badge */}
        <a
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform duration-200"
        >
          <img
            src="/black_circle_360x360.png"
            alt="Built with Bolt"
            className="w-8 h-8"
          />
        </a>
      </div>
    </nav>
  );
}