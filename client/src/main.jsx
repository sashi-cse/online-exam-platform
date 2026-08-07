import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import api from './utils/api';
import './index.css';

const MainApp = () => {
  const [googleClientId, setGoogleClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );

  useEffect(() => {
    if (!googleClientId) {
      api
        .get('/auth/config')
        .then((res) => {
          if (res.data.googleClientId) {
            setGoogleClientId(res.data.googleClientId);
          }
        })
        .catch((err) => console.warn('Could not fetch server auth config:', err));
    }
  }, [googleClientId]);

  // Fallback placeholder ID to prevent GoogleOAuthProvider crash if unconfigured
  const clientIdToUse = googleClientId || '104719000000-dummygoogleclientid.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientIdToUse}>
      <App />
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
