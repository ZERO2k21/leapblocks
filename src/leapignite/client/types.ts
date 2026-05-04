/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

export interface JuniorCostumes {
    [key: string]: string | { src: string };
}

export interface JuniorSprite {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    angle?: number;
    size?: number;
    visible?: boolean;
    mirrored?: boolean;
    speech?: string | null;
    costumes: JuniorCostumes;
    currentCostume: string;
    blocks?: any; // Blockly serialization JSON
    textColor?: string;
}

export interface JuniorScene {
    id: string;
    name: string;
    background: string;
    backgroundImage?: string;
    backdropName?: string;
    sprites: JuniorSprite[];
}

export interface JuniorProject {
    name: string;
    scenes: JuniorScene[];
    currentSceneId: string;
}
