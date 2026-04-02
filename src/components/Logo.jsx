import React from 'react';

// LeapLab left-logo (background-removed circuit letters)
export default function Logo({ height = 36, className = "" }) {
    return (
        <img
            src="/assets/leaplab_logo_transparent.png"
            alt="LeapLab"
            onError={(e) => {
                e.target.src = '/assets/leaplab_logo.png';
            }}
            style={{ height, objectFit: 'contain' }}
            className={className}
        />
    );
}

// CREOLEAP right-logo (AI Future SVG) — used on right side of topbars
export function CreoleapLogo({ height = 100, className = "", style = {} }) {
    return (
        <img
            src="/assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"
            alt="Leap into the AI Future"
            onError={(e) => {
                e.target.src = '/assets/creoleap_logo.svg';
            }}
            style={{ 
                height, 
                objectFit: 'contain',
                filter: 'brightness(1.2) contrast(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.2))', 
                ...style 
            }}
            className={className}
        />
    );
}
