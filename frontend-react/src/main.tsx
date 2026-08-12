import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './contexts/AuthContext';
import { ClinicProvider } from './contexts/ClinicContext';
import './styles.css';
import './embedded.css';
import './settings.css';
import './documents.css';
import './document-center.css';
import './branding.css';
import './home.css';

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><ClinicProvider><AuthProvider><App /></AuthProvider></ClinicProvider></BrowserRouter></StrictMode>);
