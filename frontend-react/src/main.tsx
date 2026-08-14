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
import './portal-v2.css';
import './portal-polish.css';
import './nutrition-enhancements.css';
import './document-professional.css';

function syncA4ScreenScale(){
  const scale=Math.min(1,Math.max(.32,(window.innerWidth-24)/794));
  document.documentElement.style.setProperty('--a4-screen-scale',String(scale));
}
syncA4ScreenScale();
window.addEventListener('resize',syncA4ScreenScale,{passive:true});

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><ClinicProvider><AuthProvider><App /></AuthProvider></ClinicProvider></BrowserRouter></StrictMode>);
