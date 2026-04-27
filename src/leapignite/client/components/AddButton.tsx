/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

interface AddButtonProps {
    onClick: () => void;
    icon: React.ReactNode;
}

export default function AddButton({ onClick, icon }: AddButtonProps) {
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
