import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import keycloak from './keycloak'
import HistoryPage from './pages/HistoryPage.tsx';

keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App authenticated={authenticated} />} />
          <Route path="/history" element={<HistoryPage/>} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
});