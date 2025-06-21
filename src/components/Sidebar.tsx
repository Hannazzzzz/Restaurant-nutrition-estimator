import React from 'react';
import { Link } from 'react-router-dom';
import { X, User, TrendingUp, Info, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { username, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {isLoggedIn && (
            <div className="p-4 bg-emerald-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Logged in as</p>
                  <p className="font-medium text-gray-900">{username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {/* Login/Logout */}
              {isLoggedIn ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </li>
              ) : (
                <li>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    Log In
                  </Link>
                </li>
              )}

              {/* Weekly Analysis - Only show if logged in */}
              {isLoggedIn && (
                <li>
                  <Link
                    to="/weekly-analysis"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Weekly Analysis
                  </Link>
                </li>
              )}

              {/* About */}
              <li>
                <Link
                  to="/about"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Info className="w-5 h-5" />
                  About
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              canøpy - Restaurant Nutrition Estimator
            </p>
          </div>
        </div>
      </div>
    </>
  );
}