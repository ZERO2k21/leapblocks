import React, { useState } from 'react';

interface ModeCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    gradient: string;
    delay: number;
    available: boolean;
    onClick: () => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({ 
    icon, title, subtitle, color, gradient, delay, available, onClick 
}) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                width: 200,
                height: 260,
                background: '#FFFFFF',
                border: `2.5px solid ${hovered ? color : '#F1F5F9'}`,
                borderRadius: 24,
                padding: '32px 20px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
                transition: 'all .4s cubic-bezier(.34,1.56,.64,1)',
                transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
                boxShadow: hovered
                    ? `0 20px 40px ${color}25, 0 0 0 1px ${color}15`
                    : '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
                animation: `lp-fadeup .5s ${delay}s both`,
                overflow: 'hidden',
            }}
        >
            {/* Hover Gradient Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: gradient,
                opacity: hovered ? 0.03 : 0,
                transition: 'opacity .4s',
                pointerEvents: 'none',
            }} />

            {/* Icon circle */}
            <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: hovered ? gradient : '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34,
                marginBottom: 20,
                boxShadow: hovered ? `0 8px 24px ${color}44` : 'none',
                transition: 'all .4s ease',
                transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                border: hovered ? 'none' : '1px solid #E2E8F0',
            }}>
                <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
            </div>

            {/* Title */}
            <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1E293B',
                marginBottom: 8,
                fontFamily: '"Poppins", sans-serif',
                textAlign: 'center',
                transition: 'color .3s',
            }}>
                {title}
            </div>

            {/* Subtitle */}
            <div style={{
                fontSize: 12,
                color: '#64748B',
                textAlign: 'center',
                lineHeight: 1.6,
                padding: '0 4px',
                fontFamily: '"Inter", sans-serif',
                transition: 'color .3s',
                fontWeight: 400,
            }}>
                {subtitle}
            </div>

            {/* Bottom Glow */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: '10%', right: '10%',
                height: 4,
                background: gradient,
                borderRadius: '4px 4px 0 0',
                opacity: hovered ? 1 : 0,
                transition: 'opacity .3s',
            }} />

            {/* Available indicator */}
            {available && (
                <div style={{
                    position: 'absolute',
                    top: 14, right: 14,
                    width: 10, height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    boxShadow: '0 0 10px rgba(34,197,94,0.4)',
                    border: '2px solid white',
                }} />
            )}
        </div>
    );
};
