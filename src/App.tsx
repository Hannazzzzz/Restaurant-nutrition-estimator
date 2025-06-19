import React from 'react';
import CalorieEstimator from './components/CalorieEstimator';
import CustomerFacingEstimator from './components/CustomerFacingEstimator';

function App() {
  // Check for debug parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const isDebugMode = urlParams.get('debug') === 'true';

  return isDebugMode ? <CalorieEstimator /> : <CustomerFacingEstimator />;
}

export default App;