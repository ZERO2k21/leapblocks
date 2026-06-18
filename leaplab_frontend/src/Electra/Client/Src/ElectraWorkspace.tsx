/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import { BoardSelectionModal } from './components/BoardSelectionModal';
import ForgeElectra from './ForgeElectra';
import { useForgeStore } from '../utlis/store/useForgeStore';
import { useCloudProjectStore } from '../../../store/cloudProjectStore';

interface ElectraWorkspaceProps {
    onBack: () => void;
    onHome: () => void;
    onRedirectToCreova?: (data: unknown, projectName?: string | null, projectPath?: string | null) => void;
    redirectProjectData?: unknown;
    clearRedirectProjectData?: () => void;
}

function detectBoardFromPendingProject(): 'arduino-uno' | 'esp32-c3' | null {
    const { pendingProject } = useCloudProjectStore.getState();
    if (pendingProject?.mode === 'electra') {
        const board = pendingProject.data?.board;
        if (board === 'arduino-uno' || board === 'esp32-c3') {
            console.log('[ELECTRA WORKSPACE] Board auto-detected from pending project:', board);
            return board;
        }
    }
    return null;
}

export default function ElectraWorkspace({
    onBack,
    onHome,
    onRedirectToCreova,
    redirectProjectData,
    clearRedirectProjectData
}: ElectraWorkspaceProps) {
    // Auto-detect board from saved/shared projects so the user never has to
    // re-pick the board for a project that already knows what it is.
    const [selectedBoard, setSelectedBoard] = useState<'arduino-uno' | 'esp32-c3' | null>(() => {
        if (redirectProjectData) return null; // handled by redirect effect below
        return detectBoardFromPendingProject();
    });

    // Clear workspace when component mounts
    useEffect(() => {
        if (!redirectProjectData) {
            const { clearWorkspace } = useForgeStore.getState();
            clearWorkspace();
            console.log('[ELECTRA WORKSPACE] Workspace cleared on mount');
        }
    }, [redirectProjectData]);

    // Detect board from redirect data
    useEffect(() => {
        if (redirectProjectData) {
            const projectObj = redirectProjectData as { data?: { board?: 'arduino-uno' | 'esp32-c3' } };
            const board = projectObj.data?.board || 'arduino-uno';
            console.log('[ELECTRA WORKSPACE] Board detected from redirect:', board);
            setSelectedBoard(board);
        }
    }, [redirectProjectData]);

    const handleBoardSelect = (board: 'arduino-uno' | 'esp32-c3') => {
        console.log('[ELECTRA WORKSPACE] Board selected:', board);
        setSelectedBoard(board);
    };

    if (!selectedBoard) {
        return <BoardSelectionModal onSelect={handleBoardSelect} onClose={onHome} />;
    }

    return (
        <ForgeElectra
            onBack={onBack}
            initialBoard={selectedBoard}
            onRedirectToCreova={onRedirectToCreova}
            redirectProjectData={redirectProjectData}
            clearRedirectProjectData={clearRedirectProjectData}
        />
    );
}
