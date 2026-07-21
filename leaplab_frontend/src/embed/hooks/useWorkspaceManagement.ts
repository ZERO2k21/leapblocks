import { useCallback } from 'react';
import Blockly from '@blockly-runtime';
import { migrateSingleBlock, migrateWorkspaceBlocks } from '../../utils/blocklyMigration';

export function useWorkspaceManagement(
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    activeSpriteIdRef: React.MutableRefObject<string | null>,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, object>>,
    draggedBlockStateRef: React.MutableRefObject<any>,
    lastPointerPosRef: React.MutableRefObject<{ x: number; y: number }>,
) {
    const saveCurrentSpriteWorkspace = useCallback(() => {
        const activeId = activeSpriteIdRef.current;
        if (!workspaceRef.current || !activeId) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);
        spriteWorkspacesRef.current.set(activeId, json);
        console.log('[APP] Saved workspace for sprite:', activeId);
    }, []);

    function reassignBlockIds(blockJson: any): any {
        const newId = Blockly.utils.idGenerator.genUid();
        const result: any = { ...blockJson, id: newId };

        if (result.next) {
            if (result.next.block) {
                result.next = { ...result.next, block: reassignBlockIds(result.next.block) };
            }
            if (result.next.shadow) {
                result.next = { ...result.next, shadow: reassignBlockIds(result.next.shadow) };
            }
        }

        if (result.inputs) {
            const newInputs: Record<string, any> = {};
            for (const [name, input] of Object.entries(result.inputs)) {
                const inp = input as any;
                const newInp: any = {};
                if (inp.block) newInp.block = reassignBlockIds(inp.block);
                if (inp.shadow) newInp.shadow = reassignBlockIds(inp.shadow);
                newInputs[name] = { ...inp, ...newInp };
            }
            result.inputs = newInputs;
        }

        return result;
    }

    const handleCopyBlocksToSprite = useCallback((targetSpriteId: string, blocksState: any[]) => {
        if (!targetSpriteId || !blocksState || blocksState.length === 0) return;

        const targetJson = spriteWorkspacesRef.current.get(targetSpriteId);
        const merged: any = targetJson ? JSON.parse(JSON.stringify(targetJson)) : {};

        if (!merged.blocks) {
            merged.blocks = { languageVersion: 0, blocks: [] };
        }
        if (!merged.blocks.blocks) {
            merged.blocks.blocks = [];
        }

        for (const b of blocksState) {
            const migratedBlock = migrateSingleBlock(b);
            merged.blocks.blocks.push(reassignBlockIds(migratedBlock));
        }

        spriteWorkspacesRef.current.set(targetSpriteId, merged);

        if (targetSpriteId === activeSpriteIdRef.current && workspaceRef.current) {
            const json = spriteWorkspacesRef.current.get(targetSpriteId);
            workspaceRef.current.clear();
            if (json && Object.keys(json).length > 0) {
                const migratedJson = migrateWorkspaceBlocks(json);
                Blockly.serialization.workspaces.load(migratedJson, workspaceRef.current);
            }
        }
    }, []);

    const handleCopyCodeToSprite = useCallback((sourceSpriteId: string, targetSpriteId: string) => {
        if (sourceSpriteId === targetSpriteId) return;

        if (sourceSpriteId === activeSpriteIdRef.current && workspaceRef.current) {
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            spriteWorkspacesRef.current.set(sourceSpriteId, json);
        }

        const sourceJson = spriteWorkspacesRef.current.get(sourceSpriteId);
        if (!sourceJson) return;

        const sourceBlocks = (sourceJson as any)?.blocks?.blocks;
        if (!sourceBlocks || sourceBlocks.length === 0) return;

        handleCopyBlocksToSprite(targetSpriteId, sourceBlocks);
    }, [handleCopyBlocksToSprite]);

    const handleBlockDrag = useCallback((event: any) => {
        if (event.type !== Blockly.Events.BLOCK_DRAG) return;

        if (event.isStart && event.blockId) {
            if (!workspaceRef.current) return;
            const block = workspaceRef.current.getBlockById(event.blockId);
            if (block) {
                const rootBlock = block.getRootBlock();
                draggedBlockStateRef.current = Blockly.serialization.blocks.save(rootBlock);
            }
        } else if (!event.isStart) {
            if (!draggedBlockStateRef.current) return;

            const pos = lastPointerPosRef.current;
            const spriteCards = document.querySelectorAll('[data-sprite-id]');
            let targetId: string | null = null;
            for (const card of spriteCards) {
                const rect = card.getBoundingClientRect();
                if (pos.x >= rect.left && pos.x <= rect.right &&
                    pos.y >= rect.top && pos.y <= rect.bottom) {
                    targetId = card.getAttribute('data-sprite-id');
                    break;
                }
            }
            if (targetId && targetId !== activeSpriteIdRef.current) {
                handleCopyBlocksToSprite(targetId, [draggedBlockStateRef.current]);
            }
            draggedBlockStateRef.current = null;
        }
    }, [handleCopyBlocksToSprite]);

    return {
        saveCurrentSpriteWorkspace,
        reassignBlockIds,
        handleCopyBlocksToSprite,
        handleCopyCodeToSprite,
        handleBlockDrag,
    };
}
