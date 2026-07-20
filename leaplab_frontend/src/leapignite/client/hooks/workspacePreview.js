import { previewActions } from '../../server/engine/previewActions';
import { looksPreview } from '../../server/engine/looksPreview';

export function captureSpriteState(sprite) {
    return {
        x: sprite.x, y: sprite.y, angle: sprite.angle, size: sprite.size,
        visible: sprite.visible, mirrored: sprite.mirrored, speech: sprite.speech,
        currentCostume: sprite.currentCostume
    };
}

export function getActiveSprite(scenesRef, activeSpriteIdRef) {
    const sid = activeSpriteIdRef?.current || window.activeSpriteId;
    const latestScenes = scenesRef?.current;
    if (!latestScenes) return null;
    for (const scene of latestScenes) {
        const sprite = scene.sprites.find(s => s.id === sid);
        if (sprite) return sprite;
    }
    return null;
}

export function handleBlockPreview(block, spriteActions, activeSprite, savedState, previewRevertTimerRef) {
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
        if (window.jiggle) window.jiggle(activeSprite.id);
        const revertState = captureSpriteState(activeSprite);
        previewRevertTimerRef.current = setTimeout(() => {
            spriteActions.update(activeSprite.id, savedState || revertState);
            previewRevertTimerRef.current = null;
        }, 2000);
    }

    return previewed;
}

export function createBlockClickListener({ workspaceRef, activeSpriteIdRef, scenesRef, spriteActions, previewRevertTimerRef }) {
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
