/**
 * Main entry point for "The Open Web: Ascendancy".
 * Mounts the React Three Fiber application into #root.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
