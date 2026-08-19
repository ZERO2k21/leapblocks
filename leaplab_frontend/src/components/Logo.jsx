/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

// LeapLab left-logo (background-removed circuit letters)
export default function Logo({ height, className = "" }) {
    return (
        <img
            src="assets/leaplab_logo_transparent.png"
            alt="LeapLab"
            onError={(e) => {
                e.target.src = 'assets/leaplab_logo.png';
            }}
            className={`object-contain ${className}`}
            style={height !== undefined ? { height } : undefined}
        />
    );
}

// CREOLEAP right-logo (AI Future SVG) — used on right side of topbars
export function CreoleapLogo({ height = 250, className = "", style = {} }) {
    return (
        <img
            src="assets/logo-creoleap.png"
            alt="Leap into the AI Future"
            onError={(e) => {
                e.target.src = 'assets/creoleap_logo.svg';
            }}
            className={`object-contain brightness-125 contrast-110 drop-shadow-sm ${className}`}
            style={{ height, ...style }}
        />
    );
}
