/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect } from "react";
import { ExecutionStop } from "../../server/engine/Interpreter";
import { JuniorScene, JuniorSprite } from "../types";

interface UseJuniorWindowActionsProps {
    scenes: JuniorScene[];
    currentSceneId: string;
    activeSpriteIdRef: React.MutableRefObject<string | null>;
    activeSpriteId: string | null;
    sprites: JuniorSprite[];
    spriteActions: any;
    handleSceneSelect: (sceneId: string) => void;
    handleNextScene: () => void;
    handleSpriteSelect: (spriteId: string) => void;
    timeoutRefs: React.MutableRefObject<Record<string, any>>;
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    audioEngine: any;
    setWinMessage: (msg: string | null) => void;
}

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
}: UseJuniorWindowActionsProps) {
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

        (window as any).broadcastMessage = (message: string) => {
            console.log(`[useJuniorWindowActions] Broadcasting: ${message}`);
            window.dispatchEvent(new CustomEvent('leap-broadcast', {
                detail: { message }
            }));
            (window as any).showFeedback?.(`📨 ${message}`);
        };

        (window as any).stopAll = () => {
            (window as any).showFeedback?.("STOPPED");
        };

        (window as any).stopExecution = () => {
            throw new (ExecutionStop as any)("Execution stopped by Stop block");
        };

        (window as any).resetBear = () => {
            setWinMessage(null);
            spriteActions.resetAll();
            if ((window as any).clearPen) (window as any).clearPen();
        };

        (window as any).animationSpeed = 0.5;
        (window as any).setSpeed = (speed: string) => {
            const speedMap: Record<string, number> = { slow: 0.8, normal: 0.5, fast: 0.2 };
            (window as any).animationSpeed = speedMap[speed] ?? speedMap.normal;
        };
        (window as any).getAnimationDelay = () => (window as any).animationSpeed || 0.5;

        (window as any).penColor = "#FF0000";
        (window as any).setPenColor = (color: string) => { (window as any).penColor = color; };
        (window as any).penSize = 5;
        (window as any).setPenSize = (size: any) => { (window as any).penSize = parseInt(size); };

        (window as any).stopAllSounds = () => {
            window.speechSynthesis.cancel();
            if (audioEngine) {
                audioEngine.stopAllSounds();
            }
        };

        (window as any).stopMusic = () => {
            if (audioEngine && audioEngine.soundBank) {
                audioEngine.soundBank.stopMusic();
            }
        };

        return () => {
            staticKeys.forEach(key => delete (window as any)[key]);
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
        const getCurrentID = () => (window as any).activeSpriteId || activeSpriteIdRef.current || activeSpriteId;

        (window as any).getLeapProjectData = () => ({
            scenes,
            currentSceneId,
            activeSpriteId: getCurrentID(),
            sprites
        });

        (window as any).updateSprite = (id: string, updates: any) => spriteActions.update(id || getCurrentID(), updates);

        (window as any).moveRelative = (targetOrDirection: string, directionOrSteps: any, maybeSteps?: any) => {
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

        (window as any).goToLocation = (targetOrX: any, xOrY: any, maybeY?: any) => {
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

        (window as any).changeSize = (id: string, delta: number) => {
            spriteActions.update(id || getCurrentID(), {
                size: (prev: number) => prev + delta
            });
        };

        (window as any).getCurrentSceneId = () => currentSceneId;
        (window as any).getActiveSpriteId = () => getCurrentID();
        (window as any).switchScene = (sceneId: string) => handleSceneSelect(sceneId);
        (window as any).changeScene = () => handleNextScene();

        (window as any).selectSprite = (spriteIdOrName: string) => {
            const sprite = sprites.find(s => s.id === spriteIdOrName || s.id.includes(spriteIdOrName.toLowerCase()) || s.type === spriteIdOrName.toLowerCase());
            if (sprite) handleSpriteSelect(sprite.id);
        };

        (window as any).setVisible = (id: string, val: boolean) => spriteActions.update(id || getCurrentID(), { visible: val });
        (window as any).showSprite = (id: string) => (window as any).setVisible(id || getCurrentID() || "robot_default", true);
        (window as any).hideSprite = (id: string) => (window as any).setVisible(id || getCurrentID() || "robot_default", false);

        (window as any).say = (id: string, text: string) => {
            const tid = id || getCurrentID() || "robot_default";
            if (timeoutRefs.current[tid]) clearTimeout(timeoutRefs.current[tid]);
            spriteActions.update(tid, { speech: text });
            timeoutRefs.current[tid] = setTimeout(() => {
                spriteActions.update(tid, { speech: null });
                delete timeoutRefs.current[tid];
            }, 3000);
        };

        (window as any).showFeedback = (text: string, spriteId?: string) => {
            (window as any).say(spriteId || getCurrentID(), text);
        };

        (window as any).goToRandom = (id: string) => {
            const tid = id || getCurrentID() || "robot_default";
            const randomX = Math.floor(Math.random() * 20) + 1;
            const randomY = Math.floor(Math.random() * 15) + 1;
            spriteActions.goToGrid(tid, randomX, randomY);
        };

        (window as any).moveRandom = (spriteId: string, xMin: number, xMax: number, yMin: number, yMax: number) => {
            const id = spriteId || getCurrentID() || "robot_default";
            const randomX = Math.floor(Math.random() * (xMax - xMin + 1)) + xMin;
            const randomY = Math.floor(Math.random() * (yMax - yMin + 1)) + yMin;
            spriteActions.goToGrid(id, randomX, randomY);
        };

        (window as any).setSpriteColor = (id: string, color: string) => {
            spriteActions.update(id || getCurrentID() || "robot_default", { textColor: color });
        };

        (window as any).resetSize = (id: string) => {
            spriteActions.update(id || getCurrentID() || "robot_default", { size: 100 });
        };

        (window as any).nextCostume = (id: string) => {
            const tid = id || getCurrentID() || "robot_default";
            spriteActions.update(tid, (current: JuniorSprite) => {
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

        (window as any).changeCostume = (id: string, costume: string) => {
            spriteActions.update(id || getCurrentID() || "robot_default", { currentCostume: costume });
        };

        (window as any).mirrorSprite = (id: string) => {
            spriteActions.update(id || getCurrentID() || "robot_default", (prev: JuniorSprite) => ({ mirrored: !prev.mirrored }));
        };

        (window as any).stampSprite = (id: string) => {
            const tid = id || getCurrentID();
            const handler = (window as any)._spriteActions?.[tid];
            if (handler && handler.stamp) handler.stamp();
        };

        (window as any).stampSpriteOnCanvas = (spriteId: string, sx: number, sy: number, costumeVal: any, spriteSize: number) => {
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
            if ((window as any).showFeedback) (window as any).showFeedback("Stamped!");
        };

        (window as any).playSound = (name: string) => {
            const tid = getCurrentID();
            if (audioEngine) {
                audioEngine.playSound(name, tid);
            }
        };

        (window as any).playNote = (note: any, octave: any) => {
            if (audioEngine && audioEngine.instrumentPlayer) {
                audioEngine.instrumentPlayer.playNoteForDuration(note, octave, 0.5);
            }
        };

        (window as any).setInstrument = (inst: any) => {
            if (audioEngine && audioEngine.instrumentPlayer) {
                audioEngine.instrumentPlayer.setInstrument(inst);
            }
        };

        (window as any).playMusic = (name: string) => {
            if (audioEngine && audioEngine.soundBank) {
                audioEngine.soundBank.playMusic(name);
            }
        };

        return () => {
            contextKeys.forEach(key => delete (window as any)[key]);
        };
    }, [scenes, currentSceneId, sprites, spriteActions, handleSceneSelect, handleNextScene, handleSpriteSelect, timeoutRefs, canvasRef, audioEngine]);
}
