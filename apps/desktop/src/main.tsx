import React from 'react';
import { createRoot } from 'react-dom/client';
import { Workbench } from '../../../packages/ui/src/index';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Workbench />
  </React.StrictMode>,
);
