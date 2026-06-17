/**
 * TypeScript declarations for LessonConfig.js
 */

export interface LessonConfig {
    maxBlocks: number;
    allowedShapes: string[];
    panels: {
        palette: boolean;
        workspace: boolean;
        stage: boolean;
        controls: boolean;
    };
    constraints: {
        allowSpriteAdd: boolean;
        allowSceneChange: boolean;
        allowResize?: boolean;
        maxSprites?: number;
    };
    goal?: {
        type: string;
        target: { x: number; y: number; tolerance: number };
        description: string;
    } | null;
    juniorMode?: boolean;
    hardware?: {
        allowed: boolean;
    };
}

export const DefaultLesson: { id: string; name: string; config: LessonConfig };
export const JuniorBeginnerLesson: { id: string; name: string; config: LessonConfig };

export function getLessonConfig(): LessonConfig;
export function setLessonMode(mode: string): LessonConfig;
