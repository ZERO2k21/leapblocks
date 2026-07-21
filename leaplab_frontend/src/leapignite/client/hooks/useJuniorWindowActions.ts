import { useEffect } from "react";
import { ExecutionStop } from "../../server/engine/Interpreter";

declare global {
    interface Window {
        broadcastMessage?: (message: string) => void;
        stopAll?: () => void;
        stopExecution?: () => void;
        resetBear?: () => void;
        animationSpeed?: number;
        setSpeed?: (speed: string) => void;
        getAnimationDelay?: () => number;
        penColor?: string;
        penSize?: number;
        setPenColor?: (color: string) => void;
        setPenSize?: (size: string) => void;
        stopAllSounds?: () => void;
        stopMusic?: () => void;
        speechSynthesis: SpeechSynthesis;
        getLeapProjectData?: () => any;
        updateSprite?: (id: string, updates: any) => void;
        moveRelative?: (targetOrDirection: string, directionOrSteps: any, maybeSteps?: any) => void;
        goToLocation?: (targetOrX: any, xOrY: any, maybeY?: any) => void;
        changeSize?: (id: string, delta: number) => void;
        setSize?: (id: string, size: number) => void;
        getCurrentSceneId?: () => string;
        getActiveSpriteId?: () => string;
        switchScene?: (sceneId: string) => void;
        changeScene?: () => void;
        selectSprite?: (spriteIdOrName: string) => void;
        setVisible?: (id: string, val: boolean) => void;
        showSprite?: (id: string) => void;
        hideSprite?: (id: string) => void;
        say?: (id: string, text: string) => void;
        showFeedback?: (text: string, spriteId?: string) => void;
        goToRandom?: (id: string) => void;
        moveRandom?: (spriteId: string, xMin: number, xMax: number, yMin: number, yMax: number) => void;
        setSpriteColor?: (id: string, color: string) => void;
        resetSize?: (id: string) => void;
        nextCostume?: (id: string) => void;
        changeCostume?: (id: string, costume: string) => void;
        mirrorSprite?: (id: string) => void;
        stampSprite?: (id: string) => void;
        stampSpriteOnCanvas?: (spriteId: string, sx: number, sy: number, costumeVal: string, spriteSize: number) => void;
        playSound?: (name: string) => void;
        playNote?: (note: string, octave: number) => void;
        setInstrument?: (inst: string) => void;
        playMusic?: (name: string) => void;
        __setCameraOn?: (on: boolean) => Promise<void>;
        setCameraOn?: (on: boolean) => void;
        hpCameraToggle?: (on: boolean) => Promise<void>;
        fdCameraToggle?: (on: boolean) => Promise<void>;
        _spriteActions?: Record<string, { stamp: () => void }>;
        activeSpriteId?: string;
    }
}

interface SpriteActions {
    resetAll: () => void;
    update: (id: string, updates: any) => void;
    moveRelative: (id: string, direction: string, steps: number) => void;
    goToGrid: (id: string, x: number, y: number) => void;
}

interface TimeoutRefs {
    current: Record<string, any>;
}

interface AudioEngine {
    stopAllSounds?: () => void;
    playSound?: (name: string, tid: string) => void;
    instrumentPlayer?: {
        playNoteForDuration: (note: string, octave: number, duration: number) => void;
        setInstrument: (inst: string) => void;
    };
    soundBank?: {
        stopMusic: () => void;
        playMusic: (name: string) => void;
    };
}

interface UseJuniorWindowActionsProps {
    scenes: any[];
    currentSceneId: string;
    activeSpriteIdRef: React.MutableRefObject<string>;
    activeSpriteId: string;
    sprites: any[];
    spriteActions: SpriteActions;
    handleSceneSelect: (sceneId: string) => void;
    handleNextScene: () => void;
    handleSpriteSelect: (spriteId: string) => void;
    timeoutRefs: TimeoutRefs;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    audioEngine: AudioEngine;
    setWinMessage: (msg: any) => void;
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
}: UseJuniorWindowActionsProps): void {
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
            const prevSpriteId = window.activeSpriteId;
            window.dispatchEvent(new CustomEvent('leap-broadcast', {
                detail: { message }
            }));
            window.activeSpriteId = prevSpriteId;
            window.showFeedback?.(`📨 ${message}`);
        };

        window.stopAll = () => {};

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
            const speedMap: Record<string, number> = { slow: 0.8, normal: 0.5, fast: 0.2 };
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
                audioEngine.stopAllSounds?.();
            }
        };

        window.stopMusic = () => {
            if (audioEngine && audioEngine.soundBank) {
                audioEngine.soundBank.stopMusic();
            }
        };

        return () => {
            staticKeys.forEach(key => delete (window as any)[key]);
        };
    }, [spriteActions, audioEngine, setWinMessage]);

    useEffect(() => {
        const contextKeys = [
            "getLeapProjectData",
            "updateSprite",
            "moveRelative",
            "goToLocation",
            "changeSize",
            "setSize",
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

        const getCurrentID = (): string => window.activeSpriteId || activeSpriteIdRef.current || activeSpriteId;

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
                size: (prev: number) => prev + delta
            });
        };

        window.setSize = (id, size) => {
            spriteActions.update(id || getCurrentID(), { size });
        };

        window.getCurrentSceneId = () => currentSceneId;
        window.getActiveSpriteId = () => getCurrentID();
        window.switchScene = (sceneId) => handleSceneSelect(sceneId);
        window.changeScene = () => handleNextScene();

        window.selectSprite = (spriteIdOrName) => {
            const sprite = sprites.find((s: any) => s.id === spriteIdOrName || s.id.includes(spriteIdOrName.toLowerCase()) || s.type === spriteIdOrName.toLowerCase());
            if (sprite) handleSpriteSelect(sprite.id);
        };

        window.setVisible = (id, val) => spriteActions.update(id || getCurrentID(), { visible: val });
        window.showSprite = (id) => window.setVisible!(id || getCurrentID() || "robot_default", true);
        window.hideSprite = (id) => window.setVisible!(id || getCurrentID() || "robot_default", false);

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
            window.say!(spriteId || getCurrentID(), text);
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
            spriteActions.update(tid, (current: any) => {
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
            spriteActions.update(id || getCurrentID() || "robot_default", (prev: any) => ({ mirrored: !prev.mirrored }));
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
                audioEngine.playSound?.(name, tid);
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

        window.__setCameraOn = async (on) => {
            if (window.setCameraOn) window.setCameraOn(on);
        };
        ['hpCameraToggle', 'fdCameraToggle'].forEach(key => (window as any)[key] = window.__setCameraOn);

        return () => {
            contextKeys.forEach(key => delete (window as any)[key]);
        };
    }, [scenes, currentSceneId, sprites, spriteActions, handleSceneSelect, handleNextScene, handleSpriteSelect, timeoutRefs, canvasRef, audioEngine]);
}
