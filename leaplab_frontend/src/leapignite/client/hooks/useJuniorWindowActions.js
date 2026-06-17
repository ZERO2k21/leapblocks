/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useEffect } from "react";
import { ExecutionStop } from "../../server/engine/Interpreter";

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
    audioEngine,
    setWinMessage
}) {
    // --- EFFECT 1: STATIC ACTIONS (Run Once/Rarely) ---
    useEffect(() => {
        const staticKeys = [
            "broadcastMessage",
            "stopAll",
            "stopExecution",
            "resetBear",
            "setSpeed",
            "getAnimationDelay",
            "setPenColor",
            "setPenSize",
            "stopAllSounds",
            "stopMusic"
        ];

        window.broadcastMessage = (message) => {
            console.log(`[useJuniorWindowActions] Broadcasting: ${message}`);
            window.dispatchEvent(new CustomEvent('leap-broadcast', {
                detail: { message }
            }));
            window.showFeedback?.(`📨 ${message}`);
        };

        window.stopAll = () => {
        };

        window.stopExecution = () => {
            throw new ExecutionStop("Execution stopped by Stop block");
        };

        window.resetBear = () => {
            setWinMessage(null);
            spriteActions.resetAll();
            if (window.clearPen) window.clearPen();
        };

        window.animationSpeed = 0.5;
        window.setSpeed = (speed) => {
            const speedMap = { slow: 0.8, normal: 0.5, fast: 0.2 };
            window.animationSpeed = speedMap[speed] ?? speedMap.normal;
        };
        window.getAnimationDelay = () => window.animationSpeed || 0.5;

        if (!window.penColor) window.penColor = "#FF0000";
        window.setPenColor = (color) => { window.penColor = color; };
        if (!window.penSize) window.penSize = 5;
        window.setPenSize = (size) => { window.penSize = parseInt(size); };

        window.stopAllSounds = () => {
            window.speechSynthesis.cancel();
            if (audioEngine) {
                audioEngine.stopAllSounds();
            }
        };

        window.stopMusic = () => {
            if (audioEngine && audioEngine.soundBank) {
                audioEngine.soundBank.stopMusic();
            }
        };

        return () => {
            staticKeys.forEach(key => delete window[key]);
        };
    }, [spriteActions, audioEngine, setWinMessage]);

    // --- EFFECT 2: CONTEXT-DEPENDENT ACTIONS (Depends on Ref or specific callbacks) ---
    useEffect(() => {
        const contextKeys = [
            "getLeapProjectData",
            "updateSprite",
            "moveRelative",
            "goToLocation",
            "changeSize",
            "getCurrentSceneId",
            "getActiveSpriteId",
            "switchScene",
            "changeScene",
            "selectSprite",
            "setVisible",
            "showSprite",
            "hideSprite",
            "say",
            "showFeedback",
            "goToRandom",
            "moveRandom",
            "setSpriteColor",
            "resetSize",
            "nextCostume",
            "changeCostume",
            "mirrorSprite",
            "stampSprite",
            "stampSpriteOnCanvas",
            "playSound",
            "playNote",
            "setInstrument",
            "playMusic"
        ];

        // Use a helper to always get the current ID from ref or window override
        const getCurrentID = () => window.activeSpriteId || activeSpriteIdRef.current || activeSpriteId;

        window.getLeapProjectData = () => ({
            scenes,
            currentSceneId,
            activeSpriteId: getCurrentID(),
            sprites
        });

        window.updateSprite = (id, updates) => spriteActions.update(id || getCurrentID(), updates);

        window.moveRelative = (targetOrDirection, directionOrSteps, maybeSteps) => {
            let id = getCurrentID();
            let direction = targetOrDirection;
            let steps = 1;

            if (typeof directionOrSteps === "string") {
                id = targetOrDirection || id;
                direction = directionOrSteps;
                steps = Number(maybeSteps) || 1;
            } else if (directionOrSteps !== undefined) {
                steps = Number(directionOrSteps) || 1;
            }

            if (!["UP", "DOWN", "LEFT", "RIGHT"].includes(direction)) return;
            spriteActions.moveRelative(id, direction, steps);
        };

        window.goToLocation = (targetOrX, xOrY, maybeY) => {
            let id = getCurrentID();
            let x = targetOrX;
            let y = xOrY;

            if (maybeY !== undefined) {
                id = targetOrX || id;
                x = xOrY;
                y = maybeY;
            }

            spriteActions.goToGrid(id, x, y);
        };

        window.changeSize = (id, delta) => {
            spriteActions.update(id || getCurrentID(), {
                size: (prev) => prev + delta
            });
        };

        window.getCurrentSceneId = () => currentSceneId;
        window.getActiveSpriteId = () => getCurrentID();
        window.switchScene = (sceneId) => handleSceneSelect(sceneId);
        window.changeScene = () => handleNextScene();

        window.selectSprite = (spriteIdOrName) => {
            const sprite = sprites.find(s => s.id === spriteIdOrName || s.id.includes(spriteIdOrName.toLowerCase()) || s.type === spriteIdOrName.toLowerCase());
            if (sprite) handleSpriteSelect(sprite.id);
        };

        window.setVisible = (id, val) => spriteActions.update(id || getCurrentID(), { visible: val });
        window.showSprite = (id) => window.setVisible(id || getCurrentID() || "robot_default", true);
        window.hideSprite = (id) => window.setVisible(id || getCurrentID() || "robot_default", false);

        window.say = (id, text) => {
            const tid = id || getCurrentID() || "robot_default";
            if (timeoutRefs.current[tid]) clearTimeout(timeoutRefs.current[tid]);
            spriteActions.update(tid, { speech: text });
            timeoutRefs.current[tid] = setTimeout(() => {
                spriteActions.update(tid, { speech: null });
                delete timeoutRefs.current[tid];
            }, 3000);
        };

        window.showFeedback = (text, spriteId) => {
            window.say(spriteId || getCurrentID(), text);
        };

        window.goToRandom = (id) => {
            const tid = id || getCurrentID() || "robot_default";
            const randomX = Math.floor(Math.random() * 20) + 1;
            const randomY = Math.floor(Math.random() * 15) + 1;
            spriteActions.goToGrid(tid, randomX, randomY);
        };

        window.moveRandom = (spriteId, xMin, xMax, yMin, yMax) => {
            const id = spriteId || getCurrentID() || "robot_default";
            const randomX = Math.floor(Math.random() * (xMax - xMin + 1)) + xMin;
            const randomY = Math.floor(Math.random() * (yMax - yMin + 1)) + yMin;
            spriteActions.goToGrid(id, randomX, randomY);
        };

        window.setSpriteColor = (id, color) => {
            spriteActions.update(id || getCurrentID() || "robot_default", { textColor: color });
        };

        window.resetSize = (id) => {
            spriteActions.update(id || getCurrentID() || "robot_default", { size: 100 });
        };

        window.nextCostume = (id) => {
            const tid = id || getCurrentID() || "robot_default";
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
            spriteActions.update(id || getCurrentID() || "robot_default", { currentCostume: costume });
        };

        window.mirrorSprite = (id) => {
            spriteActions.update(id || getCurrentID() || "robot_default", (prev) => ({ mirrored: !prev.mirrored }));
        };

        window.stampSprite = (id) => {
            const tid = id || getCurrentID();
            const handler = window._spriteActions?.[tid];
            if (handler && handler.stamp) handler.stamp();
        };

        window.stampSpriteOnCanvas = (spriteId, sx, sy, costumeVal, spriteSize) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const scale = (spriteSize || 100) / 100;
            const drawSize = 50 * scale;

            if (typeof costumeVal === 'string' && (
                costumeVal.includes('/') || costumeVal.startsWith('http') ||
                costumeVal.includes('data:image') || costumeVal.endsWith('.png') ||
                costumeVal.endsWith('.jpg') || costumeVal.endsWith('.svg')
            )) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => ctx.drawImage(img, sx, sy, drawSize, drawSize);
                img.src = costumeVal;
            } else {
                ctx.font = `${Math.round(drawSize)}px serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(costumeVal || '✏️', sx, sy);
            }
            if (window.showFeedback) window.showFeedback("Stamped!");
        };

        window.playSound = (name) => {
            const tid = getCurrentID();
            if (audioEngine) {
                audioEngine.playSound(name, tid);
            }
        };

        window.playNote = (note, octave) => {
            if (audioEngine && audioEngine.instrumentPlayer) {
                audioEngine.instrumentPlayer.playNoteForDuration(note, octave, 0.5);
            }
        };

        window.setInstrument = (inst) => {
            if (audioEngine && audioEngine.instrumentPlayer) {
                audioEngine.instrumentPlayer.setInstrument(inst);
            }
        };

        window.playMusic = (name) => {
            if (audioEngine && audioEngine.soundBank) {
                audioEngine.soundBank.playMusic(name);
            }
        };

        return () => {
            contextKeys.forEach(key => delete window[key]);
        };
    }, [scenes, currentSceneId, sprites, spriteActions, handleSceneSelect, handleNextScene, handleSpriteSelect, timeoutRefs, canvasRef, audioEngine]);
}
