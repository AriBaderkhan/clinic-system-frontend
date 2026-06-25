import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { SettingProvider } from './context/SettingContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import './index.css';
import App from './App.jsx';
import { initTheme } from './utils/theme';

initTheme(); // apply saved dark/light mode before render (no flash)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingProvider>
          <SubscriptionProvider>
            <App />
          </SubscriptionProvider>
        </SettingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
