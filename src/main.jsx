import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { SettingProvider } from './context/SettingContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingProvider>
          <App />
        </SettingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
