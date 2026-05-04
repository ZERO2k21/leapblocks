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
            className="min-w-[70px] w-[70px] h-[70px] rounded-xl border-2 border-dashed border-[#aaa] flex items-center justify-center cursor-pointer text-2xl bg-[#f9f9f9] hover:bg-white transition-colors"
        >
            {icon}
        </div>
    );
}
