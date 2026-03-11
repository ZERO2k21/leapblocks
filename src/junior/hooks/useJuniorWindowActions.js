import { useEffect } from "react";
import { ExecutionStop } from "../engine/Interpreter";

export function useJuniorWindowActions({
    scenes,
    currentSceneId,
    activeSpriteIdRef,
    activeSpriteId,
    sprites,
    spriteActions,
    handleSceneSelect,
    handleNextScene,
    handleSpriteSelect,
    timeoutRefs,
    canvasRef,
    soundBlocksExt,
    musicBlocksExt,
    setWinMessage
}) {
    useEffect(() => {
        window.getLeapProjectData = () => ({ scenes, currentSceneId, activeSpriteId, sprites });

        window.updateSprite = (id, updates) => spriteActions.update(id, updates);

        window.moveRelative = (dir) => {
            const id = window.activeSpriteId || activeSpriteId;
            spriteActions.moveRelative(id, dir);
        };

        window.goToLocation = (x, y) => {
            const id = window.activeSpriteId || activeSpriteId;
            spriteActions.goToGrid(id, x, y);
        };

        window.resetBear = () => {
            setWinMessage(null);
            spriteActions.resetAll();
        };

        window.changeSize = (id, delta) => {
            spriteActions.update(id, {
                size: (prev) => prev + delta
            });
        };

        window.getCurrentSceneId = () => currentSceneId;
        window.getActiveSpriteId = () => activeSpriteId;
        window.switchScene = (sceneId) => handleSceneSelect(sceneId);
        window.changeScene = () => handleNextScene();

        window.selectSprite = (spriteIdOrName) => {
            const sprite = sprites.find(s => s.id === spriteIdOrName || s.id.includes(spriteIdOrName.toLowerCase()) || s.type === spriteIdOrName.toLowerCase());
            if (sprite) {
                handleSpriteSelect(sprite.id);
            }
        };

        window.setVisible = (id, val) => spriteActions.update(id, { visible: val });
        window.showSprite = (id) => window.setVisible(id || window.activeSpriteId || "robot_default", true);
        window.hideSprite = (id) => window.setVisible(id || window.activeSpriteId || "robot_default", false);

        window.say = (id, text) => {
            const tid = id || window.activeSpriteId || "robot_default";
            if (timeoutRefs.current[tid]) clearTimeout(timeoutRefs.current[tid]);
            spriteActions.update(tid, { speech: text });
            timeoutRefs.current[tid] = setTimeout(() => {
                spriteActions.update(tid, { speech: null });
                delete timeoutRefs.current[tid];
            }, 3000);
        };

        window.goToRandom = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            const randomX = Math.floor(Math.random() * 15) + 1;
            const randomY = Math.floor(Math.random() * 10) + 1;
            spriteActions.goToGrid(tid, randomX, randomY);
        };

        window.animationSpeed = 500;

        window.setSpriteColor = (id, color) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { textColor: color });
        };

        window.resetSize = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { size: 100 });
        };

        window.nextCostume = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, (current) => {
                if (current.costumes) {
                    const keys = Object.keys(current.costumes);
                    if (keys.length > 1) {
                        const currentKey = current.currentCostume || "default";
                        const idx = keys.indexOf(currentKey);
                        const nextIdx = (idx === -1) ? 0 : (idx + 1) % keys.length;
                        return { currentCostume: keys[nextIdx] };
                    }
                }
                return {};
            });
        };

        window.changeCostume = (id, costume) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, { currentCostume: costume });
        };

        window.mirrorSprite = (id) => {
            const tid = id || window.activeSpriteId || "robot_default";
            spriteActions.update(tid, (prev) => ({ mirrored: !prev.mirrored }));
        };

        window.stampSprite = (id) => {
            const handler = window._spriteActions?.[id];
            if (handler && handler.stamp) {
                handler.stamp();
            }
        };

        window.stampSpriteOnCanvas = (spriteId, sx, sy, costumeVal, spriteSize) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const scale = (spriteSize || 100) / 100;
            const drawSize = 50 * scale;

            if (typeof costumeVal === 'string' && (
                costumeVal.includes('/') ||
                costumeVal.startsWith('http') ||
                costumeVal.includes('data:image') ||
                costumeVal.endsWith('.png') ||
                costumeVal.endsWith('.jpg') ||
                costumeVal.endsWith('.svg')
            )) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    ctx.drawImage(img, sx, sy, drawSize, drawSize);
                };
                img.src = costumeVal;
            } else {
                ctx.font = `${Math.round(drawSize)}px serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(costumeVal || '✏️', sx, sy);
            }

            if (window.showFeedback) window.showFeedback("Stamped!");
        };

        window.penColor = "#FF0000";
        window.setPenColor = (color) => {
            window.penColor = color;
        };

        window.penSize = 5;
        window.setPenSize = (size) => {
            window.penSize = parseInt(size);
        };

        window.playSound = (name) => {
            soundBlocksExt.playSound({ SOUND_MENU: name }, { target: { id: window.activeSpriteId || activeSpriteId } });
        };
        window.playNote = (note, octave) => {
            musicBlocksExt.playNoteForDuration({ NOTE: note, OCTAVE: octave, DURATION: 0.5 });
        };
        window.setInstrument = (inst) => {
            musicBlocksExt.setInstrument({ INSTRUMENT: inst });
        };
        window.stopAllSounds = () => {
            window.speechSynthesis.cancel();
            soundBlocksExt.stopAllSounds();
        };

        window.playMusic = (name) => {
            musicBlocksExt.playMusic({ MUSIC: name });
        };
        window.stopMusic = () => {
            musicBlocksExt.stopMusic();
        };

        window.stopExecution = () => {
            throw new ExecutionStop("Execution stopped by Stop block");
        };

    }, [spriteActions, activeSpriteId, currentSceneId, sprites, handleSceneSelect, handleNextScene, handleSpriteSelect, timeoutRefs, canvasRef, soundBlocksExt, musicBlocksExt, setWinMessage]);
}
