import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CalorieEstimator from './components/CalorieEstimator';
import CustomerFacingEstimator from './components/CustomerFacingEstimator';
import SciFiEstimator from './components/SciFiEstimator';
import WeeklyAnalysisPage from './pages/WeeklyAnalysisPage';
import AboutPage from './pages/AboutPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';
  const isDarkMode = urlParams.get('dark') === 'true';

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="pt-16">
          <Routes>
            {/* Public routes */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/weekly-analysis" element={<WeeklyAnalysisPage />} />
            
            {/* Main food input page - accessible to everyone */}
            <Route path="/" element={
              isDarkMode ? <SciFiEstimator /> : 
              isDebugMode ? <CalorieEstimator /> : 
              <CustomerFacingEstimator />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;