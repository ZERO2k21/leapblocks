import React from 'react';

export default function TobiSprite({ size = 100, angle = 0, visible = true, speech = '' }) {
    if (!visible) return null;
    
    const rotation = angle - 90; // Adjust for SVG orientation
    
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg 
                width={size} 
                height={size} 
                viewBox="0 0 100 100" 
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))'
                }}
            >
                {/* Body - Brown fur */}
                <ellipse cx="50" cy="65" rx="30" ry="25" fill="#8B4513" />
                
                {/* Head - Brown fur */}
                <circle cx="50" cy="35" r="25" fill="#8B4513" />
                
                {/* Ears */}
                <circle cx="30" cy="20" r="8" fill="#8B4513" />
                <circle cx="70" cy="20" r="8" fill="#8B4513" />
                <circle cx="30" cy="20" r="5" fill="#D2691E" />
                <circle cx="70" cy="20" r="5" fill="#D2691E" />
                
                {/* Face - Lighter brown */}
                <ellipse cx="50" cy="40" rx="18" ry="15" fill="#D2691E" />
                
                {/* Eyes - Blue glasses */}
                <rect x="35" y="30" width="12" height="8" rx="2" fill="#1E90FF" opacity="0.8" />
                <rect x="53" y="30" width="12" height="8" rx="2" fill="#1E90FF" opacity="0.8" />
                <circle cx="41" cy="34" r="3" fill="#000" />
                <circle cx="59" cy="34" r="3" fill="#000" />
                <circle cx="42" cy="33" r="1" fill="#fff" />
                <circle cx="60" cy="33" r="1" fill="#fff" />
                
                {/* Nose */}
                <ellipse cx="50" cy="42" rx="3" ry="2" fill="#000" />
                
                {/* Mouth - Smile */}
                <path d="M 45 48 Q 50 52 55 48" stroke="#000" strokeWidth="1.5" fill="none" />
                
                {/* White shirt */}
                <path d="M 30 60 Q 50 55 70 60 L 75 85 Q 50 90 25 85 Z" fill="#FFFFFF" />
                
                {/* Red pants */}
                <path d="M 25 85 Q 50 90 75 85 L 70 100 Q 50 100 30 100 Z" fill="#FF0000" />
                
                {/* Arms */}
                <ellipse cx="25" cy="70" rx="8" ry="12" fill="#8B4513" />
                <ellipse cx="75" cy="70" rx="8" ry="12" fill="#8B4513" />
                
                {/* Feet */}
                <ellipse cx="40" cy="98" rx="8" ry="4" fill="#8B4513" />
                <ellipse cx="60" cy="98" rx="8" ry="4" fill="#8B4513" />
            </svg>
            
            {/* Speech bubble */}
            {speech && (
                <div style={{
                    position: 'absolute',
                    top: -40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    border: '2px solid #333',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 10,
                }}>
                    {speech}
                    <div style={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid #333',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -5,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #fff',
                    }} />
                </div>
            )}
        </div>
    );
}