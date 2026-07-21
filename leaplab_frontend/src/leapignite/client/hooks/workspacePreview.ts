import Blockly from '@blockly-runtime';
import { previewActions } from '../../server/engine/previewActions';
import { looksPreview } from '../../server/engine/looksPreview';

interface SpriteState {
    x: number;
    y: number;
    angle: number;
    size: number;
    visible: boolean;
    mirrored: boolean;
    speech: string;
    currentCostume: string;
}

interface SpriteActions {
    update: (id: string, state: Partial<SpriteState>) => void;
}

interface BlocklyClickEvent {
    type: string;
    blockId: string;
}

export function captureSpriteState(sprite: any): SpriteState {
    return {
        x: sprite.x, y: sprite.y, angle: sprite.angle, size: sprite.size,
        visible: sprite.visible, mirrored: sprite.mirrored, speech: sprite.speech,
        currentCostume: sprite.currentCostume
    };
}

export function getActiveSprite(scenesRef: React.MutableRefObject<any>, activeSpriteIdRef: React.MutableRefObject<string>): any {
    const sid = activeSpriteIdRef?.current || window.activeSpriteId;
    const latestScenes = scenesRef?.current;
    if (!latestScenes) return null;
    for (const scene of latestScenes) {
        const sprite = scene.sprites.find((s: any) => s.id === sid);
        if (sprite) return sprite;
    }
    return null;
}

export function handleBlockPreview(
    block: any,
    spriteActions: SpriteActions,
    activeSprite: any,
    savedState: SpriteState,
    previewRevertTimerRef: React.MutableRefObject<any>
): boolean {
    if (!block || !activeSprite) return false;

    if (previewRevertTimerRef?.current) {
        clearTimeout(previewRevertTimerRef.current);
        previewRevertTimerRef.current = null;
    }

    let previewed = false;
    if (looksPreview[block.type]) {
        looksPreview[block.type](block);
        previewed = true;
    } else if (previewActions[block.type]) {
        previewActions[block.type](block);
        previewed = true;
    }

    if (previewed) {
        if ((window as any).jiggle) (window as any).jiggle(activeSprite.id);
        const revertState = captureSpriteState(activeSprite);
        previewRevertTimerRef.current = setTimeout(() => {
            spriteActions.update(activeSprite.id, savedState || revertState);
            previewRevertTimerRef.current = null;
        }, 2000);
    }

    return previewed;
}

export function createBlockClickListener({
    workspaceRef, activeSpriteIdRef, scenesRef, spriteActions, previewRevertTimerRef
}: {
    workspaceRef: React.RefObject<any>;
    activeSpriteIdRef: React.MutableRefObject<string>;
    scenesRef: React.MutableRefObject<any>;
    spriteActions: SpriteActions;
    previewRevertTimerRef: React.MutableRefObject<any>;
}): (e: BlocklyClickEvent) => void {
    return (e) => {
        if (e.type !== Blockly.Events.CLICK) return;
        const block = workspaceRef?.current?.getBlockById(e.blockId);
        if (!block) return;

        const activeSprite = getActiveSprite(scenesRef, activeSpriteIdRef);
        if (!activeSprite) return;

        const savedState = captureSpriteState(activeSprite);
        handleBlockPreview(block, spriteActions, activeSprite, savedState, previewRevertTimerRef);
    };
}
