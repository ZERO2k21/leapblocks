/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import { BoardSelectionModal } from './components/BoardSelectionModal';
import ForgeCreova from './ForgeCreova';
import { useForgeStore } from '../utlis/store/useForgeStore';

interface ElectraCreovaProps {
    onBack: () => void;
    onHome: () => void;
}

export default function ElectraCreova({ onBack, onHome }: ElectraCreovaProps) {
    const [selectedBoard, setSelectedBoard] = useState<'arduino-uno' | 'esp32-c3' | null>(null);

    // Clear workspace when component mounts
    useEffect(() => {
        const { clearWorkspace } = useForgeStore.getState();
        clearWorkspace();
        console.log('[ELECTRA CREOVA] Workspace cleared on mount');
    }, []);

    const handleBoardSelect = (board: 'arduino-uno' | 'esp32-c3') => {
        console.log('[ELECTRA CREOVA] Board selected:', board);
        setSelectedBoard(board);
    };

    if (!selectedBoard) {
        return <BoardSelectionModal onSelect={handleBoardSelect} onClose={onHome} />;
    }

    return <ForgeCreova onBack={onBack} initialBoard={selectedBoard} />;
}
