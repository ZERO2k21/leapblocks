interface BlockDef {
    type: string;
    shape: string;
    args?: string[];
    isLoop?: boolean;
    maxDepth?: number;
}

export const ValidBlocks: Record<string, BlockDef> = {
    'move_right': { type: "motion", shape: "stack", args: ["steps"] },
    'move_left': { type: "motion", shape: "stack", args: ["steps"] },
    'move_up': { type: "motion", shape: "stack", args: ["steps"] },
    'move_down': { type: "motion", shape: "stack", args: ["steps"] },
    'turn_right': { type: "motion", shape: "stack", args: ["times"] },
    'turn_left': { type: "motion", shape: "stack", args: ["times"] },
    'jump': { type: "motion", shape: "stack", args: ["times"] },
    'go_to_location': { type: "motion", shape: "stack", args: ["x", "y"] },
    'move_relative': { type: "motion", shape: "stack", args: ["direction"] },

    'looks_say': { type: "looks", shape: "stack" },
    'say_text': { type: "looks", shape: "stack" },
    'show_sprite': { type: "looks", shape: "stack" },
    'hide_sprite': { type: "looks", shape: "stack" },
    'change_size': { type: "looks", shape: "stack" },
    'set_size': { type: "looks", shape: "stack" },
    'run': { type: "looks", shape: "stack" },
    'looks_grow': { type: "looks", shape: "stack" },
    'looks_shrink': { type: "looks", shape: "stack" },
    'looks_turn_back': { type: "looks", shape: "stack" },
    'looks_walk': { type: "looks", shape: "stack" },

    'control_forever': { type: "control", shape: "c-block", isLoop: true, maxDepth: 1 },
    'control_repeat': { type: "control", shape: "c-block", isLoop: true, maxDepth: 1 },
    'control_turn': { type: "control", shape: "stack" },
    'control_reverse': { type: "control", shape: "stack" },
    'control_stop': { type: "control", shape: "cap" },
    'control_scene': { type: "control", shape: "stack" },

    'event_flag': { type: "event", shape: "hat" },
    'event_press': { type: "event", shape: "hat" },
    'event_up': { type: "event", shape: "hat" },
    'event_down': { type: "event", shape: "hat" },
    'event_mail_give': { type: "event", shape: "stack" },
    'event_mail_get': { type: "event", shape: "hat" },

    'sound_record': { type: "sound", shape: "stack" },
    'sound_vol': { type: "sound", shape: "stack" },
    'sound_animal': { type: "sound", shape: "stack" },
    'sound_music': { type: "sound", shape: "stack" },
    'sound_mute': { type: "sound", shape: "stack" },

    'pen_down': { type: "pen", shape: "stack" },
    'pen_up': { type: "pen", shape: "stack" },
    'pen_brush': { type: "pen", shape: "stack" },
    'pen_eraser': { type: "pen", shape: "stack" },
    'pen_graph': { type: "pen", shape: "stack" },
    'pen_adjust': { type: "pen", shape: "stack" }
};

export const Rules = {
    MaxLoopDepth: 1,
    RequireHat: true
} as const;
