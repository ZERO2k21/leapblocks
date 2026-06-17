/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

// Timing instrumentation
const RENDERER_START = performance.now();
const logRendererTiming = (label: string) => {
    const elapsed = (performance.now() - RENDERER_START).toFixed(2);
    console.log(`[RENDERER TIMING] ${elapsed}ms - ${label}`);
};

logRendererTiming('Renderer script started');

logRendererTiming('React imported');
import React from 'react';

import { createRoot } from 'react-dom/client';
logRendererTiming('ReactDOM imported');

import App from './App';
logRendererTiming('App component imported');

import './index.css';
logRendererTiming('CSS imported');

const container = document.getElementById('root');
logRendererTiming('Root element found');

if (container) {
    const root = createRoot(container);
    logRendererTiming('React root created');

    root.render(<App />);
    logRendererTiming('App rendered');

    // Log when React finishes painting
    requestAnimationFrame(() => {
        logRendererTiming('First frame painted');

        requestIdleCallback(() => {
            logRendererTiming('Browser idle - startup complete');
        }, { timeout: 1000 });
    });
}
