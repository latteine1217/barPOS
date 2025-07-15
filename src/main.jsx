import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import Capacitor plugins for mobile functionality
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Initialize mobile features if running on native platforms
const initializeMobileFeatures = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    
    // Hide splash screen after initialization
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);
    
    // Prevent app from being closed accidentally
    document.addEventListener('backbutton', (e) => {
      e.preventDefault();
    });
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Initialize mobile features after React app mounts
initializeMobileFeatures();