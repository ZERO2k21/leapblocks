/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';

interface TrainButtonProps {
    onClick?: () => void;
    isTraining?: boolean;
    disabled?: boolean;
}

export default function TrainButton({ onClick, isTraining, disabled }: TrainButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isTraining || disabled}
            className={`w-full py-3 rounded-2xl font-semibold transition-all ${isTraining || disabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#6b21a8] text-white hover:bg-[#7c3aed]'
                }`}
        >
            {isTraining ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    <span>Training...</span>
                </span>
            ) : (
                'Train Model'
            )}
        </button>
    );
}
