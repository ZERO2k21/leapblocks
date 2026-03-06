import React from 'react';

export default function Logo({ height = 28, className = "" }) {
    return (
        <img
            src="/assets/c-logo-svg.svg"
            alt="LeapBlocks"
            onError={(e) => {
                // Fallback if topbar_logo.svg is missing
                e.target.src = '/assets/leapblocks_logo.svg';
            }}
            style={{ height, objectFit: 'contain' }}
            className={className}
        />
    );
}
