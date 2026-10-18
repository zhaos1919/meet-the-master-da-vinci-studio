import React from 'react';
import { createRoot } from 'react-dom/client';
import StudioV3 from './app/studio-v3';
import './app/globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudioV3 />
  </React.StrictMode>,
);
