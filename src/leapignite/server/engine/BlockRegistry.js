/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * Junior Block Registry
 * The Single Source of Truth for Block Definitions and Rules.
 */
export const ValidBlocks = {
    // --- MOTION ---
    'move_right': { type: "motion", shape: "stack", args: ["steps"] },
    'move_left': { type: "motion", shape: "stack", args: ["steps"] },
    'move_up': { type: "motion", shape: "stack", args: ["steps"] },
    'move_down': { type: "motion", shape: "stack", args: ["steps"] },
    'turn_right': { type: "motion", shape: "stack", args: ["times"] },
    'turn_left': { type: "motion", shape: "stack", args: ["times"] },
    'jump': { type: "motion", shape: "stack", args: ["times"] },
    'go_to_location': { type: "motion", shape: "stack", args: ["x", "y"] },
    'move_relative': { type: "motion", shape: "stack", args: ["direction"] },

    // --- LOOKS ---
    'looks_say': { type: "looks", shape: "stack" },
    'say_text': { type: "looks", shape: "stack" },
    'show_sprite': { type: "looks", shape: "stack" },
    'hide_sprite': { type: "looks", shape: "stack" },
    'change_size': { type: "looks", shape: "stack" },
    'run': { type: "looks", shape: "stack" },
    'looks_grow': { type: "looks", shape: "stack" },
    'looks_shrink': { type: "looks", shape: "stack" },
    'looks_turn_back': { type: "looks", shape: "stack" },
    'looks_walk': { type: "looks", shape: "stack" },

    // --- CONTROL ---
    'control_forever': { type: "control", shape: "c-block", isLoop: true, maxDepth: 1 },
    'control_repeat': { type: "control", shape: "c-block", isLoop: true, maxDepth: 1 },
    'control_turn': { type: "control", shape: "stack" },
    'control_reverse': { type: "control", shape: "stack" },
    'control_stop': { type: "control", shape: "cap" }, // Cap means end of stack
    'control_scene': { type: "control", shape: "stack" },

    // --- EVENTS (HATS) ---
    'event_flag': { type: "event", shape: "hat" },
    'event_press': { type: "event", shape: "hat" },
    'event_up': { type: "event", shape: "hat" },
    'event_down': { type: "event", shape: "hat" },
    'event_mail_give': { type: "event", shape: "stack" }, // Actually often a stack ender sending msg
    'event_mail_get': { type: "event", shape: "hat" },

    // --- SOUND ---
    'sound_record': { type: "sound", shape: "stack" },
    'sound_vol': { type: "sound", shape: "stack" },
    'sound_animal': { type: "sound", shape: "stack" },
    'sound_music': { type: "sound", shape: "stack" },
    'sound_mute': { type: "sound", shape: "stack" },

    // --- PEN ---
    'pen_down': { type: "pen", shape: "stack" },
    'pen_up': { type: "pen", shape: "stack" },
    'pen_brush': { type: "pen", shape: "stack" },
    'pen_eraser': { type: "pen", shape: "stack" },
    'pen_graph': { type: "pen", shape: "stack" },
    'pen_adjust': { type: "pen", shape: "stack" }
};

export const Rules = {
    MaxLoopDepth: 1, // No loops inside loops
    RequireHat: true // All stacks must start with a Hat
};
