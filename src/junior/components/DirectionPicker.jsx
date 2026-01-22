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
