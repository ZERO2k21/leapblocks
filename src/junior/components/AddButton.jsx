import React from 'react';

export default function AddButton({ onClick, icon }) {
    return (
        <div
            onClick={onClick}
            style={{
                minWidth: 70, // Changed width to minWidth to prevent shrinking
                width: 70,
                height: 70,
                borderRadius: 12,
                border: "2px dashed #aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 24,
                background: "#f9f9f9"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff"}
            onMouseLeave={e => e.currentTarget.style.background = "#f9f9f9"}
        >
            {icon}
        </div>
    );
}
