import React from 'react';
import CalorieEstimator from './components/CalorieEstimator';
import CustomerFacingEstimator from './components/CustomerFacingEstimator';
import SciFiEstimator from './components/SciFiEstimator';

function App() {
  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';
  const isDarkMode = urlParams.get('dark') === 'true';

  // Render appropriate component based on URL parameters
  if (isDarkMode) {
    return <SciFiEstimator />;
  } else if (isDebugMode) {
    return <CalorieEstimator />;
  } else {
    return <CustomerFacingEstimator />;
  }
}

export default App;