/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfill HTML5 Drag and Drop for touch devices (iOS Safari, Android Chrome, etc.)
import { polyfill } from 'mobile-drag-drop';
polyfill({ forceApply: true });

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
