/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * Lesson Configuration Service
 * Controls the UI layout and constraints based on the current "Lesson" or Mode.
 * In a full app, this would be fetched from a backend server.
 */

export const DefaultLesson = {
    id: "free_play",
    name: "Free Play",
    config: {
        maxBlocks: 100, // Effectively unlimited
        allowedShapes: ["stack", "hat", "c-block", "cap"],
        panels: {
            palette: true,
            workspace: true,
            stage: true,
            controls: true
        },
        constraints: {
            allowSpriteAdd: true,
            allowSceneChange: true
        }
    }
};

export const JuniorBeginnerLesson = {
    id: "level_1",
    name: "Reach the Star",
    config: {
        maxBlocks: 6,
        allowedShapes: ["stack", "hat"],
        panels: {
            palette: true,
            workspace: true,
            stage: true,
            controls: true // We need flag to run
        },
        constraints: {
            allowSpriteAdd: false, // Locked to single sprite
            allowSceneChange: false,
            allowResize: false, // Cannot resize
            maxSprites: 1
        },
        goal: {
            type: "reach_target",
            target: { x: 400, y: 150, tolerance: 50 }, // Target X,Y (Pixels)
            description: "Make the bear reach the right side!"
        },
        juniorMode: true, // Hides File/Edit menus
        hardware: {
            allowed: false // Hides Connect button
        }
    }
};

// Current active config
let currentConfig = DefaultLesson.config;

export const getLessonConfig = () => currentConfig;

export const setLessonMode = (mode) => {
    if (mode === "beginner") currentConfig = JuniorBeginnerLesson.config;
    else currentConfig = DefaultLesson.config;
    return currentConfig;
};
