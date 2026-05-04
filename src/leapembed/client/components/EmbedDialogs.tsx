/**
 * EmbedDialogs.tsx
 * All modal dialogs: Make Variable/List/Table/Block, Board Selection,
 * Backdrop/Sprite libraries, Upload modal, Extension library, Unsaved warning.
 */
import React from 'react';
import MakeVariableDialog from './MakeVariableDialog';
import MakeListDialog from './MakeListDialog';
import MakeTableDialog from './MakeTableDialog';
import MakeBlockDialog from './MakeBlockDialog';
import type { BlockArgument } from './MakeBlockDialog';
import BoardSelectionModal from './BoardSelectionModal';
import UploadModal from './UploadModal';
import UnsavedWarningModal from '../../../leapignite/client/components/UnsavedWarningModal';
import type Blockly from '../../server/blockly/runtime';

const BackdropLibrary = React.lazy(() => import('./BackdropLibrary'));
const SpriteLibrary = React.lazy(() => import('./SpriteLibrary').then(m => ({ default: m.SpriteLibrary })));
const JuniorExtensionLibrary = React.lazy(() => import('../../../leapignite/client/components/JuniorExtensionLibrary'));

interface EmbedDialogsProps {
    workspace: Blockly.WorkspaceSvg | null;
    selectedSpriteId: string | null;
    // Make dialogs
    isMakeVariableOpen: boolean; setIsMakeVariableOpen: (v: boolean) => void;
    isMakeListOpen: boolean; setIsMakeListOpen: (v: boolean) => void;
    isMakeTableOpen: boolean; setIsMakeTableOpen: (v: boolean) => void;
    isMakeBlockOpen: boolean; setIsMakeBlockOpen: (v: boolean) => void;
    onCreateVariable: (v: { name: string; type: 'Number' | 'String'; scope: 'all_sprites' | 'this_sprite' }) => void;
    onCreateList: (l: { name: string; scope: 'all_sprites' | 'this_sprite' }) => void;
    onCreateTable: (t: { name: string; rows: number; cols: number; scope: 'all_sprites' | 'this_sprite' }) => void;
    onCreateBlock: (b: { name: string; arguments: BlockArgument[]; warp: boolean }) => void;
    // Board modal
    isBoardModalOpen: boolean; setIsBoardModalOpen: (v: boolean) => void;
    selectedBoard: string; onSelectBoard: (id: string, name: string) => void;
    // Libraries
    showSpriteLibrary: boolean; setShowSpriteLibrary: (v: boolean) => void;
    showBackdropLibrary: boolean; setShowBackdropLibrary: (v: boolean) => void;
    showExtensionLibrary: boolean; setShowExtensionLibrary: (v: boolean) => void;
    onSelectSprite: (entry: any) => void;
    onPaintSprite: () => void;
    onSelectBackdrop: (name: string, src: string) => void;
    onAddExtension: (id: string) => void;
    installedExtensions?: Set<string>;
    // Upload
    isUploading: boolean; uploadProgress: string;
    // Unsaved
    showUnsavedModal: boolean;
    onConfirmUnsaved: (saveFirst: boolean) => void;
    onCancelUnsaved: () => void;
}

export const EmbedDialogs: React.FC<EmbedDialogsProps> = ({
    workspace, selectedSpriteId,
    isMakeVariableOpen, setIsMakeVariableOpen, onCreateVariable,
    isMakeListOpen, setIsMakeListOpen, onCreateList,
    isMakeTableOpen, setIsMakeTableOpen, onCreateTable,
    isMakeBlockOpen, setIsMakeBlockOpen, onCreateBlock,
    isBoardModalOpen, setIsBoardModalOpen, selectedBoard, onSelectBoard,
    showSpriteLibrary, setShowSpriteLibrary,
    showBackdropLibrary, setShowBackdropLibrary,
    showExtensionLibrary, setShowExtensionLibrary,
    onSelectSprite, onPaintSprite, onSelectBackdrop, onAddExtension,
    installedExtensions,
    isUploading, uploadProgress,
    showUnsavedModal, onConfirmUnsaved, onCancelUnsaved,
}) => (
    <>
        {/* Make Variable */}
        <MakeVariableDialog isOpen={isMakeVariableOpen} onClose={() => setIsMakeVariableOpen(false)}
            onCreateVariable={onCreateVariable} workspace={workspace} />

        {/* Make List */}
        <MakeListDialog isOpen={isMakeListOpen} onClose={() => setIsMakeListOpen(false)}
            onCreateList={onCreateList} workspace={workspace} />

        {/* Make Table */}
        <MakeTableDialog isOpen={isMakeTableOpen} onClose={() => setIsMakeTableOpen(false)}
            onCreateTable={onCreateTable} workspace={workspace} />

        {/* Make Block */}
        <MakeBlockDialog isOpen={isMakeBlockOpen} onClose={() => setIsMakeBlockOpen(false)}
            onCreateBlock={onCreateBlock} workspace={workspace} />

        {/* Board Selection */}
        {isBoardModalOpen && (
            <BoardSelectionModal isOpen={isBoardModalOpen} selectedBoard={selectedBoard}
                onSelectBoard={onSelectBoard} onClose={() => setIsBoardModalOpen(false)} />
        )}

        {/* Sprite Library */}
        {showSpriteLibrary && (
            <React.Suspense fallback={null}>
                <SpriteLibrary isOpen={true} onClose={() => setShowSpriteLibrary(false)}
                    onSelectSprite={onSelectSprite} onPaintSprite={onPaintSprite} />
            </React.Suspense>
        )}

        {/* Backdrop Library */}
        {showBackdropLibrary && (
            <React.Suspense fallback={null}>
                <BackdropLibrary isOpen={true} onClose={() => setShowBackdropLibrary(false)}
                    onSelectBackdrop={(backdrop) => {
                        onSelectBackdrop(backdrop.name, backdrop.image);
                        setShowBackdropLibrary(false);
                    }} />
            </React.Suspense>
        )}

        {/* Extension Library */}
        {showExtensionLibrary && (
            <React.Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#855CD6' }}>Loading...</div>}>
                <JuniorExtensionLibrary
                    onClose={() => setShowExtensionLibrary(false)}
                    onSelectExtension={(id: string) => { onAddExtension(id); /* keep library open so user can add more */ }}
                    installedExtensions={installedExtensions}
                />
            </React.Suspense>
        )}

        {/* Upload Modal */}
        <UploadModal isOpen={isUploading} progress={uploadProgress} />

        {/* Unsaved Warning */}
        {showUnsavedModal && (
            <UnsavedWarningModal isOpen={showUnsavedModal}
                onSave={() => onConfirmUnsaved(true)}
                onDiscard={() => onConfirmUnsaved(false)}
                onCancel={onCancelUnsaved} />
        )}
    </>
);
