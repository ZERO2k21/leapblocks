/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import '../styles/directionPicker.css';

export default function DirectionPicker({ onPick }) {
    return (
        <div className="dir-overlay">
            <div className="dir-box" onClick={(e) => e.stopPropagation()}>

                {/* Top Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => onPick("UP")}>⬆</button>
                </div>

                <div className="dir-middle">
                    <button onClick={() => onPick("LEFT")}>⬅</button>
                    <button onClick={() => onPick("CENTER")}>📍</button>
                    <button onClick={() => onPick("RIGHT")}>⮕</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => onPick("DOWN")}>⬇</button>
                </div>

            </div>
        </div>
    );
}
