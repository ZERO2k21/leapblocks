import React from 'react';

// LeapLab left-logo (background-removed circuit letters)
export default function Logo({ height = 36, className = "" }) {
    return (
        <img
            src="/assets/leaplab_logo.png"
            alt="LeapLab"
            onError={(e) => {
                e.target.src = '/assets/logo.svg';
            }}
            style={{ height, objectFit: 'contain' }}
            className={className}
        />
    );
}

// CREOLEAP right-logo (AI Future SVG) — used on right side of topbars
export function CreoleapLogo({ height = 36, className = "" }) {
    return (
        <img
            src="/assets/creoleap_logo.svg"
            alt="Leap into the AI Future"
            onError={(e) => {
                e.target.style.display = 'none';
            }}
            style={{ height, objectFit: 'contain' }}
            className={className}
        />
    );
}
