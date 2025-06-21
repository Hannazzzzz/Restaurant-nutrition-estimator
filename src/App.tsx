import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CalorieEstimator from './components/CalorieEstimator';
import CustomerFacingEstimator from './components/CustomerFacingEstimator';
import SciFiEstimator from './components/SciFiEstimator';
import LoginPage from './pages/LoginPage';
import WeeklyAnalysisPage from './pages/WeeklyAnalysisPage';
import AboutPage from './pages/AboutPage';

function AppContent() {
  const { isLoggedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';
  const isDarkMode = urlParams.get('dark') === 'true';

  // If user is not logged in, show login page
  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-16">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/weekly-analysis" element={<WeeklyAnalysisPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/" element={
            isDarkMode ? <SciFiEstimator /> : 
            isDebugMode ? <CalorieEstimator /> : 
            <CustomerFacingEstimator />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;