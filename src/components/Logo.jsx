import React from 'react';

export default function Logo({ height = 36, className = "" }) {
    return (
        <img
            src="/assets/logo.svg"
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
