export const CATEGORIES = [
    { id: "events", name: "Events", color: "#FFBF00", icon: <span role="img" aria-label="flag">🏁</span> },
    { id: "motion", name: "Motion", color: "#4C97FF", icon: <span role="img" aria-label="motion">👣</span> },
    { id: "looks", name: "Looks", color: "#9966FF", icon: <span role="img" aria-label="looks">👁️</span> },
    { id: "sound", name: "Sound", color: "#CF63CF", icon: <span role="img" aria-label="sound">🔊</span> },
    { id: "control", name: "Control", color: "#FFAB19", icon: <span role="img" aria-label="control">✋</span> },
    { id: "pen", name: "Pen", color: "#0FBD8C", icon: <span role="img" aria-label="pen">🖊️</span> },
];

export const categoryContents = {
    motion: [
        { kind: "block", type: "move_right" },
        { kind: "block", type: "move_left" },
        { kind: "block", type: "move_up" },
        { kind: "block", type: "move_down" },
        { kind: "block", type: "turn_right" },
        { kind: "block", type: "turn_left" },
        { kind: "block", type: "jump" },
        { kind: "block", type: "go_to_location" },
        { kind: "block", type: "go_random" },
        { kind: "block", type: "change_speed" }
    ],
    looks: [
        { kind: "block", type: "say_text" },
        { kind: "block", type: "show_sprite" },
        { kind: "block", type: "hide_sprite" },
        { kind: "block", type: "junior_change_costume" },
        { kind: "block", type: "change_size" },
        { kind: "block", type: "set_size" },
        { kind: "block", type: "looks_change_costume" },
        { kind: "block", type: "looks_mirror" },
        { kind: "block", type: "select_sprite" },
        { kind: "block", type: "switch_scene" }
    ],
    control: [
        { kind: "block", type: "control_forever" },
        { kind: "block", type: "control_repeat" },
        { kind: "block", type: "control_wait" },
        { kind: "block", type: "control_stop" },
        { kind: "block", type: "control_scene" }
    ],
    events: [
        { kind: "block", type: "event_flag" },
        { kind: "block", type: "event_up" },
        { kind: "block", type: "event_down" },
        { kind: "block", type: "event_press" },
        { kind: "block", type: "broadcast_message" },
        { kind: "block", type: "when_receive_message" }
    ],
    sound: [
        { kind: "block", type: "sound_play" },
        { kind: "button", text: "🎤", callbackKey: "RECORD_SOUND" },
        { kind: "block", type: "sound_play_music" },
        { kind: "block", type: "sound_instrument" },
        { kind: "block", type: "sound_note" },
        { kind: "block", type: "sound_stop" }
    ],
    pen: [
        { kind: "block", type: "pen_down" },
        { kind: "block", type: "pen_up" },
        { kind: "block", type: "pen_set_color" },
        { kind: "block", type: "pen_set_size" },
        { kind: "block", type: "pen_stamp" },
        { kind: "block", type: "pen_eraser" }
    ]
};

export const BLOCK_TYPE_TO_CATEGORY = {};
CATEGORIES.forEach(cat => {
    const blocks = categoryContents[cat.id] || [];
    blocks.forEach(b => { if (b.kind === 'block') BLOCK_TYPE_TO_CATEGORY[b.type] = cat.id; });
});

const EXTRA_CATEGORY_MAP = {
    move_right: 'motion', move_left: 'motion', move_up: 'motion', move_down: 'motion',
    turn_right: 'motion', turn_left: 'motion', jump: 'motion', run: 'motion', findout: 'motion',
    go_to_location: 'motion', move_relative: 'motion', go_random: 'motion', change_speed: 'motion',
    looks_say: 'looks', looks_show: 'looks', looks_hide: 'looks', looks_grow: 'looks',
    looks_shrink: 'looks', looks_turn_back: 'looks', looks_walk: 'looks', looks_call: 'looks',
    looks_symmetry: 'looks', looks_change_costume: 'looks', looks_mirror: 'looks',
    say_text: 'looks', show_sprite: 'looks', hide_sprite: 'looks',
    junior_change_costume: 'looks', change_size: 'looks', set_size: 'looks', select_sprite: 'looks', switch_scene: 'looks',
    control_forever: 'control', control_repeat: 'control', control_wait: 'control',
    control_stop: 'control', control_scene: 'control',
    event_flag: 'events', event_up: 'events', event_down: 'events', event_press: 'events',
    broadcast_message: 'events', when_receive_message: 'events',
    sound_play: 'sound', sound_play_music: 'sound', sound_instrument: 'sound',
    sound_note: 'sound', sound_stop: 'sound', sound_animal: 'sound',
    pen_down: 'pen', pen_up: 'pen', pen_set_color: 'pen', pen_set_size: 'pen',
    pen_stamp: 'pen', pen_eraser: 'pen',
};
Object.assign(BLOCK_TYPE_TO_CATEGORY, EXTRA_CATEGORY_MAP);
