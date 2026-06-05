/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import { BoardSelectionModal } from './components/BoardSelectionModal';
import ForgeStudio from './ForgeStudio';
import { useForgeStore } from '../utlis/store/useForgeStore';

interface ElectraStudioProps {
    onBack: () => void;
    onHome: () => void;
}

export default function ElectraStudio({ onBack, onHome }: ElectraStudioProps) {
    const [selectedBoard, setSelectedBoard] = useState<'arduino-uno' | 'esp32-c3' | null>(null);

    // Clear workspace when component mounts
    useEffect(() => {
        const { clearWorkspace } = useForgeStore.getState();
        clearWorkspace();
        console.log('[ELECTRA STUDIO] Workspace cleared on mount');
    }, []);

    const handleBoardSelect = (board: 'arduino-uno' | 'esp32-c3') => {
        console.log('[ELECTRA STUDIO] Board selected:', board);
        setSelectedBoard(board);
    };

    if (!selectedBoard) {
        return <BoardSelectionModal onSelect={handleBoardSelect} onClose={onHome} />;
    }

    return <ForgeStudio onBack={onBack} initialBoard={selectedBoard} />;
}
