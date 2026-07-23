/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

export default function AddButton({ onClick, icon }) {
    return (
        <div
            onClick={onClick}
            className="min-w-18 w-18 h-18 shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-2xl bg-gray-50 hover:bg-white transition-colors"
        >
            {icon}
        </div>
    );
}
