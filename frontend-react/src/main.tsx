import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './contexts/AuthContext';
import './styles.css';
import './embedded.css';
import './settings.css';
import './documents.css';
import './document-center.css';

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></StrictMode>);
