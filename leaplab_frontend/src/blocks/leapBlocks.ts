/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

import Blockly from '@blockly-runtime';

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const leapBlocks = [
    // ═══════════════════════════════════════════════════════════════════════════
    // MOTION (18 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'motion_movesteps',
        message0: 'move %1 steps',
        args0: [{ type: 'field_number', name: 'STEPS', value: 10, min: -1000, max: 1000 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Moves the sprite forward or backward.'
    },
    {
        type: 'motion_turnright',
        message0: 'turn ↻ %1 degrees',
        args0: [{ type: 'field_angle', name: 'DEGREES', value: 15 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Turns the sprite clockwise.'
    },
    {
        type: 'motion_turnleft',
        message0: 'turn ↺ %1 degrees',
        args0: [{ type: 'field_angle', name: 'DEGREES', value: 15 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Turns the sprite counter-clockwise.'
    },
    {
        type: 'motion_goto',
        message0: 'go to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TO',
            options: [
                ['random position', '_random_'],
                ['mouse-pointer', '_mouse_']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Moves the sprite to a specific position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Go_To_%28block%29'
    },
    {
        type: 'motion_gotoxy',
        message0: 'go to x: %1 y: %2',
        args0: [
            { type: 'field_number', name: 'X', value: 0 },
            { type: 'field_number', name: 'Y', value: 0 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Moves the sprite to the specified X and Y coordinates.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Go_to_X,_Y_%28block%29'
    },
    {
        type: 'motion_glideto',
        message0: 'glide %1 secs to %2',
        args0: [
            { type: 'field_number', name: 'SECS', value: 1, min: 0.1 },
            {
                type: 'field_dropdown',
                name: 'TO',
                options: [
                    ['random position', '_random_'],
                    ['mouse-pointer', '_mouse_']
                ]
            }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Glides the sprite smoothly to a position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Glide_%28block%29'
    },
    {
        type: 'motion_glidesecstoxy',
        message0: 'glide %1 secs to x: %2 y: %3',
        args0: [
            { type: 'field_number', name: 'SECS', value: 1, min: 0.1 },
            { type: 'field_number', name: 'X', value: 0 },
            { type: 'field_number', name: 'Y', value: 0 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Glides the sprite to specific X and Y coordinates over a duration.',
        helpUrl: ''
    },
    {
        type: 'motion_pointindirection',
        message0: 'point in direction %1',
        args0: [{ type: 'field_angle', name: 'DIRECTION', value: 90 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Points the sprite in a specific direction.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Point_in_Direction_%28block%29'
    },
    {
        type: 'motion_pointtowards',
        message0: 'point towards %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TOWARDS',
            options: [
                ['mouse-pointer', '_mouse_']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Points the sprite towards the mouse pointer or another sprite.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Point_Towards_%28block%29'
    },
    {
        type: 'motion_changexby',
        message0: 'change x by %1',
        args0: [{ type: 'field_number', name: 'DX', value: 10 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Changes the sprite’s horizontal position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Change_X_By_%28block%29'
    },
    {
        type: 'motion_setx',
        message0: 'set x to %1',
        args0: [{ type: 'field_number', name: 'X', value: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Sets the sprite’s horizontal position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_X_to_%28block%29'
    },
    {
        type: 'motion_changeyby',
        message0: 'change y by %1',
        args0: [{ type: 'field_number', name: 'DY', value: 10 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Changes the sprite’s vertical position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Change_Y_By_%28block%29'
    },
    {
        type: 'motion_sety',
        message0: 'set y to %1',
        args0: [{ type: 'field_number', name: 'Y', value: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Sets the sprite’s vertical position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_Y_to_%28block%29'
    },
    {
        type: 'motion_ifonedgebounce',
        message0: 'if on edge, bounce',
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Bounces the sprite when it touches the edge.',
        helpUrl: 'https://en.leap-wiki.info/wiki/If_on_Edge,_Bounce_%28block%29'
    },
    {
        type: 'motion_setrotationstyle',
        message0: 'set rotation style %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STYLE',
            options: [
                ['left-right', 'left-right'],
                ["don't rotate", "don't rotate"],
                ['all around', 'all around']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#4C97FF',
        tooltip: 'Sets how the sprite rotates when moving.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_Rotation_Style_%28block%29'
    },
    {
        type: 'motion_xposition',
        message0: 'x position',
        output: 'Number',
        colour: '#4C97FF',
        tooltip: 'The sprite’s X position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/X_Position_%28block%29'
    },
    {
        type: 'motion_yposition',
        message0: 'y position',
        output: 'Number',
        colour: '#4C97FF',
        tooltip: 'The sprite’s Y position.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Y_Position_%28block%29'
    },
    {
        type: 'motion_direction',
        message0: 'direction',
        output: 'Number',
        colour: '#4C97FF',
        tooltip: 'The direction the sprite is pointing.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Direction_%28block%29'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOKS (20 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'looks_sayforsecs',
        message0: 'say %1 for %2 seconds',
        args0: [
            { type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] },
            { type: 'input_value', name: 'SECS', check: 'Number' }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Displays a speech bubble for a specified duration.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Say_for_Seconds_%28block%29'
    },
    {
        type: 'looks_say',
        message0: 'say %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Displays a speech bubble that stays until Next is clicked.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Say_%28block%29'
    },
    {
        type: 'looks_thinkforsecs',
        message0: 'think %1 for %2 seconds',
        args0: [
            { type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] },
            { type: 'input_value', name: 'SECS', check: 'Number' }
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Displays a thought bubble for a specified duration.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Think_for_Seconds_%28block%29'
    },
    {
        type: 'looks_think',
        message0: 'think %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Displays a thought bubble that stays until Next is clicked.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Think_%28block%29'
    },
    {
        type: 'looks_switchcostumeto',
        message0: 'switch costume to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'COSTUME',
            options: [] // Populated dynamically at runtime
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Switches to a specific costume.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Switch_Costume_to_%28block%29'
    },
    {
        type: 'looks_nextcostume',
        message0: 'next costume',
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Switches to the next costume in the list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Next_Costume_%28block%29'
    },
    {
        type: 'looks_switchbackdropto',
        message0: 'switch backdrop to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'BACKDROP',
            options: [] // Populated dynamically at runtime
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Switches to a specific backdrop.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Switch_Backdrop_to_%28block%29'
    },
    {
        type: 'looks_nextbackdrop',
        message0: 'next backdrop',
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Switches to the next backdrop.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Next_Backdrop_%28block%29'
    },
    {
        type: 'looks_changesizeby',
        message0: 'change size by %1',
        args0: [{ type: 'field_number', name: 'CHANGE', value: 10 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Changes the sprite’s size by a percentage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Change_Size_By_%28block%29'
    },
    {
        type: 'looks_setsizeto',
        message0: 'set size to %1 %',
        args0: [{ type: 'field_number', name: 'SIZE', value: 100, min: 1, max: 500 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Sets the sprite’s size to a specific percentage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_Size_to_%28block%29'
    },
    {
        type: 'looks_changeeffectby',
        message0: 'change %1 effect by %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [
                    ['color', 'COLOR'],
                    ['fisheye', 'FISHEYE'],
                    ['whirl', 'WHIRL'],
                    ['pixelate', 'PIXELATE'],
                    ['mosaic', 'MOSAIC'],
                    ['brightness', 'BRIGHTNESS'],
                    ['ghost', 'GHOST']
                ]
            },
            { type: 'field_number', name: 'CHANGE', value: 25 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Changes a graphic effect by a specified amount.',
        helpUrl: ''
    },
    {
        type: 'looks_seteffectto',
        message0: 'set %1 effect to %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [
                    ['color', 'COLOR'],
                    ['fisheye', 'FISHEYE'],
                    ['whirl', 'WHIRL'],
                    ['pixelate', 'PIXELATE'],
                    ['mosaic', 'MOSAIC'],
                    ['brightness', 'BRIGHTNESS'],
                    ['ghost', 'GHOST']
                ]
            },
            { type: 'field_number', name: 'VALUE', value: 0 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Sets a graphic effect to a specific value.',
        helpUrl: ''
    },
    {
        type: 'looks_cleargraphiceffects',
        message0: 'clear graphic effects',
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Clears all graphic effects.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Clear_Graphic_Effects_%28block%29'
    },
    {
        type: 'looks_show',
        message0: 'show',
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Makes the sprite visible.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Show_%28block%29'
    },
    {
        type: 'looks_hide',
        message0: 'hide',
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Makes the sprite invisible.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Hide_%28block%29'
    },
    {
        type: 'looks_gotofrontback',
        message0: 'go to %1 layer',
        args0: [{
            type: 'field_dropdown',
            name: 'FRONT_BACK',
            options: [['front', 'front'], ['back', 'back']]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Moves the sprite to the front or back layer.',
        helpUrl: ''
    },
    {
        type: 'looks_goforwardbackwardlayers',
        message0: 'go %1 %2 layers',
        args0: [
            { type: 'field_dropdown', name: 'FORWARD_BACKWARD', options: [['forward', 'forward'], ['backward', 'backward']] },
            { type: 'field_number', name: 'NUM', value: 1, min: 1 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#9966FF',
        tooltip: 'Moves the sprite forward or backward by layers.',
        helpUrl: ''
    },
    {
        type: 'looks_costumenumbername',
        message0: 'costume %1',
        args0: [{
            type: 'field_dropdown',
            name: 'NUMBER_NAME',
            options: [['number', 'number'], ['name', 'name']]
        }],
        output: 'String',
        colour: '#9966FF',
        tooltip: 'Gets the current costume number or name.',
        helpUrl: ''
    },
    {
        type: 'looks_backdropnumbername',
        message0: 'backdrop %1',
        args0: [{
            type: 'field_dropdown',
            name: 'NUMBER_NAME',
            options: [['number', 'number'], ['name', 'name']]
        }],
        output: 'String',
        colour: '#9966FF',
        tooltip: 'Gets the current backdrop number or name.',
        helpUrl: ''
    },
    {
        type: 'looks_size',
        message0: 'size',
        output: 'Number',
        colour: '#9966FF',
        tooltip: 'The sprite’s size as a percentage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Size_%28block%29'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUND (9 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'sound_playuntildone',
        message0: 'play sound %1 until done',
        args0: [{
            type: 'field_dropdown',
            name: 'SOUND_MENU',
            options: [] // Populated dynamically
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Plays a sound and pauses the script until it finishes.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Play_Sound_Until_Done_%28block%29'
    },
    {
        type: 'sound_play',
        message0: 'start sound %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SOUND_MENU',
            options: [] // Populated dynamically
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Plays a sound and continues immediately.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Start_Sound_%28block%29'
    },
    {
        type: 'sound_stopallsounds',
        message0: 'stop all sounds',
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Stops all currently playing sounds.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Stop_All_Sounds_%28block%29'
    },
    {
        type: 'sound_changeeffectby',
        message0: 'change %1 effect by %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [['pitch', 'PITCH'], ['pan left/right', 'PAN']]
            },
            { type: 'field_number', name: 'VALUE', value: 10 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Changes a sound effect by the specified amount.',
        helpUrl: ''
    },
    {
        type: 'sound_seteffectto',
        message0: 'set %1 effect to %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [['pitch', 'PITCH'], ['pan left/right', 'PAN']]
            },
            { type: 'field_number', name: 'VALUE', value: 100 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Sets a sound effect to a specific value.',
        helpUrl: ''
    },
    {
        type: 'sound_cleareffects',
        message0: 'clear sound effects',
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Clears all sound effects.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Clear_Sound_Effects_%28block%29'
    },
    {
        type: 'sound_changevolumeby',
        message0: 'change volume by %1',
        args0: [{ type: 'field_number', name: 'VOLUME', value: -10 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Changes the volume by a percentage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Change_Volume_by_%28block%29'
    },
    {
        type: 'sound_setvolumeto',
        message0: 'set volume to %1 %',
        args0: [{ type: 'field_number', name: 'VOLUME', value: 100, min: 0, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#CF63CF',
        tooltip: 'Sets the volume to a specific percentage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_Volume_to_%28block%29'
    },
    {
        type: 'sound_volume',
        message0: 'volume',
        output: 'Number',
        colour: '#CF63CF',
        tooltip: 'The current volume level.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Volume_%28block%29'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS (8 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'event_whenflagclicked',
        message0: 'when flag clicked',
        args0: [{
            type: 'field_image',
            src: 'https://leap.mit.edu/static/assets/40a08e64c22e43f55050f22495914a27.svg',
            width: 24,
            height: 24,
            alt: 'flag'
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when the green flag is clicked.',
        helpUrl: 'https://en.leap-wiki.info/wiki/When_Flag_Clicked_%28block%29'
    },
    {
        type: 'event_whenkeypressed',
        message0: 'when %1 key pressed',
        args0: [{
            type: 'field_dropdown',
            name: 'KEY_OPTION',
            options: [
                ['space', 'space'],
                ['up arrow', 'up arrow'],
                ['down arrow', 'down arrow'],
                ['left arrow', 'left arrow'],
                ['right arrow', 'right arrow'],
                ['a', 'a'],
                ['b', 'b'],
                ['c', 'c'],
                ['d', 'd'],
                ['e', 'e'],
                ['f', 'f'],
                ['g', 'g'],
                ['h', 'h'],
                ['i', 'i'],
                ['j', 'j'],
                ['k', 'k'],
                ['l', 'l'],
                ['m', 'm'],
                ['n', 'n'],
                ['o', 'o'],
                ['p', 'p'],
                ['q', 'q'],
                ['r', 'r'],
                ['s', 's'],
                ['t', 't'],
                ['u', 'u'],
                ['v', 'v'],
                ['w', 'w'],
                ['x', 'x'],
                ['y', 'y'],
                ['z', 'z'],
                ['0', '0'],
                ['1', '1'],
                ['2', '2'],
                ['3', '3'],
                ['4', '4'],
                ['5', '5'],
                ['6', '6'],
                ['7', '7'],
                ['8', '8'],
                ['9', '9']
            ]
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when a specific key is pressed.'
    },
    {
        type: 'event_whenthisspriteclicked',
        message0: 'when this sprite clicked',
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when this sprite is clicked.',
        helpUrl: 'https://en.leap-wiki.info/wiki/When_This_Sprite_Clicked_%28block%29'
    },
    {
        type: 'event_whenbackdropswitchesto',
        message0: 'when backdrop switches to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'BACKDROP',
            options: [] // Populated dynamically
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when the backdrop changes to a specific one.',
        helpUrl: ''
    },
    {
        type: 'event_whengreaterthan',
        message0: 'when %1 > %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'WHEN',
                options: [
                    ['loudness', 'LOUDNESS'],
                    ['timer', 'TIMER']
                ]
            },
            { type: 'field_number', name: 'VALUE', value: 10 }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when a value exceeds a threshold.',
        helpUrl: ''
    },
    {
        type: 'event_whenbroadcastreceived',
        message0: 'when I receive %1',
        args0: [{
            type: 'field_dropdown',
            name: 'BROADCAST_OPTION',
            options: [] // Populated dynamically
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Runs when a broadcast is received.',
        helpUrl: 'https://en.leap-wiki.info/wiki/When_I_Receive_%28block%29'
    },
    {
        type: 'event_broadcastandwait',
        message0: 'broadcast %1 and wait',
        args0: [{
            type: 'field_dropdown',
            name: 'BROADCAST_INPUT',
            options: [] // Populated dynamically
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFBF00',
        tooltip: 'Sends a broadcast and waits for all scripts to finish.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Broadcast_and_Wait_%28block%29'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL (11 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'control_wait',
        message0: 'wait %1 seconds',
        args0: [{ type: 'field_number', name: 'DURATION', value: 1, min: 0 }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Pauses the script for a specified duration.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Wait_Seconds_%28block%29'
    },
    {
        type: 'control_repeat',
        message0: 'repeat %1',
        args0: [{ type: 'field_number', name: 'TIMES', value: 10, min: 1 }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Repeats the enclosed blocks a specified number of times.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Repeat_%28block%29'
    },
    {
        type: 'control_forever',
        message0: 'forever',
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Repeats the enclosed blocks forever.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Forever_%28block%29'
    },
    {
        type: 'control_if',
        message0: 'if %1 then',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Runs the enclosed blocks if the condition is true.',
        helpUrl: 'https://en.leap-wiki.info/wiki/If_Then_%28block%29'
    },
    {
        type: 'control_if_else',
        message0: 'if %1 then',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        message2: 'else %1',
        args2: [{ type: 'input_statement', name: 'ELSE' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Runs one set of blocks if the condition is true, another if false.',
        helpUrl: 'https://en.leap-wiki.info/wiki/If_Then_Else_%28block%29'
    },
    {
        type: 'control_wait_until',
        message0: 'wait until %1',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Pauses the script until the condition is true.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Wait_Until_%28block%29'
    },
    {
        type: 'control_repeat_until',
        message0: 'repeat until %1',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Repeats the enclosed blocks until the condition is true.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Repeat_Until_%28block%29'
    },
    {
        type: 'control_stop',
        message0: 'stop %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STOP_OPTION',
            options: [
                ['all', 'all'],
                ['this script', 'this script'],
                ['other scripts in sprite', 'other scripts in sprite']
            ]
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Stops the currently running scripts.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Stop_%28block%29'
    },
    {
        type: 'control_start_as_clone',
        message0: 'when I start as a clone',
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Runs when a clone is created.',
        helpUrl: 'https://en.leap-wiki.info/wiki/When_I_Start_As_a_Clone_%28block%29'
    },
    {
        type: 'control_create_clone_of',
        message0: 'create clone of %1',
        args0: [{
            type: 'field_dropdown',
            name: 'CLONE_OPTION',
            options: [['myself', '_myself_']]
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FFAB19',
        tooltip: 'Creates a clone of a sprite.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Create_Clone_of_%28block%29'
    },
    {
        type: 'control_delete_this_clone',
        message0: 'delete this clone',
        previousStatement: 'any',
        nextStatement: null,
        colour: '#FFAB19',
        tooltip: 'Deletes the current clone.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Delete_This_Clone_%28block%29'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SENSING (18 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'sensing_touchingobject',
        message0: 'touching %1 ?',
        args0: [{
            type: 'field_dropdown',
            name: 'TOUCHINGOBJECTMENU',
            options: [
                ['mouse-pointer', '_mouse_'],
                ['edge', '_edge_']
            ]
        }],
        output: 'Boolean',
        colour: '#5CB1D6',
        tooltip: 'Checks if the sprite is touching the mouse-pointer or edge.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Touching_%28block%29'
    },
    {
        type: 'sensing_touchingcolor',
        message0: 'touching color %1 ?',
        args0: [{ type: 'field_colour', name: 'COLOR', colour: '#ff0000' }],
        output: 'Boolean',
        colour: '#5CB1D6',
        tooltip: 'Checks if the sprite is touching a specific color.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Touching_Color_%28block%29'
    },
    {
        type: 'sensing_coloristouchingcolor',
        message0: 'color %1 is touching %2 ?',
        args0: [
            { type: 'field_colour', name: 'COLOR1', colour: '#ff0000' },
            { type: 'field_colour', name: 'COLOR2', colour: '#00ff00' }
        ],
        output: 'Boolean',
        colour: '#5CB1D6',
        tooltip: 'Checks if two colors are touching.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Color_is_Touching_Color_%28block%29'
    },
    {
        type: 'sensing_distanceto',
        message0: 'distance to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'DISTANCETOMENU',
            options: [['mouse-pointer', '_mouse_']]
        }],
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'Reports the distance to the mouse-pointer or another sprite.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Distance_to_%28block%29'
    },
    {
        type: 'sensing_askandwait',
        message0: 'ask %1 and wait',
        args0: [{ type: 'field_input', name: 'QUESTION', text: "What's your name?" }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#5CB1D6',
        tooltip: 'Asks a question and pauses until the user enters an answer.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Ask_and_Wait_%28block%29'
    },
    {
        type: 'sensing_answer',
        message0: 'answer',
        output: ['String', 'Number'],
        colour: '#5CB1D6',
        tooltip: 'The answer to the last asked question.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Answer_%28block%29'
    },
    {
        type: 'sensing_keypressed',
        message0: 'key %1 pressed?',
        args0: [{
            type: 'field_dropdown',
            name: 'KEY_OPTION',
            options: [
                ['space', 'space'],
                ['up arrow', 'up arrow'],
                ['down arrow', 'down arrow'],
                ['left arrow', 'left arrow'],
                ['right arrow', 'right arrow'],
                ['a', 'a'],
                ['b', 'b'],
                ['c', 'c'],
                ['d', 'd'],
                ['e', 'e'],
                ['f', 'f'],
                ['g', 'g'],
                ['h', 'h'],
                ['i', 'i'],
                ['j', 'j'],
                ['k', 'k'],
                ['l', 'l'],
                ['m', 'm'],
                ['n', 'n'],
                ['o', 'o'],
                ['p', 'p'],
                ['q', 'q'],
                ['r', 'r'],
                ['s', 's'],
                ['t', 't'],
                ['u', 'u'],
                ['v', 'v'],
                ['w', 'w'],
                ['x', 'x'],
                ['y', 'y'],
                ['z', 'z'],
                ['0', '0'],
                ['1', '1'],
                ['2', '2'],
                ['3', '3'],
                ['4', '4'],
                ['5', '5'],
                ['6', '6'],
                ['7', '7'],
                ['8', '8'],
                ['9', '9'],
                ['any', 'any']
            ]
        }],
        output: 'Boolean',
        colour: '#5CB1D6',
        tooltip: 'Checks if a specific key is pressed.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Key_Pressed_%28block%29'
    },
    {
        type: 'sensing_mousedown',
        message0: 'mouse down?',
        output: 'Boolean',
        colour: '#5CB1D6',
        tooltip: 'Checks if the mouse button is pressed.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Mouse_Down_%28block%29'
    },
    {
        type: 'sensing_mousex',
        message0: 'mouse x',
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'The current X position of the mouse pointer.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Mouse_X_%28block%29'
    },
    {
        type: 'sensing_mousey',
        message0: 'mouse y',
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'The current Y position of the mouse pointer.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Mouse_Y_%28block%29'
    },
    {
        type: 'sensing_setdragmode',
        message0: 'set drag mode %1',
        args0: [{
            type: 'field_dropdown',
            name: 'DRAG_MODE',
            options: [['draggable', 'draggable'], ['not draggable', 'not draggable']]
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#5CB1D6',
        tooltip: 'Sets whether the sprite can be dragged.',
        helpUrl: ''
    },
    {
        type: 'sensing_loudness',
        message0: 'loudness',
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'The loudness level from the microphone.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Loudness_%28block%29'
    },
    {
        type: 'sensing_timer',
        message0: 'timer',
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'Reports how many seconds have elapsed since the timer was reset.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Timer_%28block%29'
    },
    {
        type: 'sensing_resettimer',
        message0: 'reset timer',
        previousStatement: null,
        nextStatement: 'any',
        colour: '#5CB1D6',
        tooltip: 'Resets the timer to 0.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Reset_Timer_%28block%29'
    },
    {
        type: 'sensing_of',
        message0: '%1 of %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PROPERTY',
                options: [
                    ['x position', 'x position'],
                    ['y position', 'y position'],
                    ['direction', 'direction'],
                    ['costume #', 'costume #'],
                    ['backdrop #', 'backdrop #'],
                    ['size', 'size'],
                    ['volume', 'volume']
                ]
            },
            {
                type: 'field_dropdown',
                name: 'OBJECT',
                options: [] // Populated dynamically with sprite names
            }
        ],
        output: null,
        colour: '#5CB1D6',
        tooltip: 'Gets a property of a sprite or the stage.',
        helpUrl: ''
    },
    {
        type: 'sensing_current',
        message0: 'current %1',
        args0: [{
            type: 'field_dropdown',
            name: 'CURRENTMENU',
            options: [
                ['year', 'YEAR'],
                ['month', 'MONTH'],
                ['date', 'DATE'],
                ['day of week', 'DAYOFWEEK'],
                ['hour', 'HOUR'],
                ['minute', 'MINUTE'],
                ['second', 'SECOND']
            ]
        }],
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'Reports the current year, month, date, day of week, hour, minute, or second.',
        helpUrl: ''
    },
    {
        type: 'sensing_dayssince2000',
        message0: 'days since 2000',
        output: 'Number',
        colour: '#5CB1D6',
        tooltip: 'Reports the number of days since January 1, 2000.',
        helpUrl: ''
    },
    {
        type: 'sensing_username',
        message0: 'username',
        output: 'String',
        colour: '#5CB1D6',
        tooltip: 'The username of the user viewing the project.',
        helpUrl: ''
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // OPERATORS (18 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'operator_add',
        message0: '%1 + %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Adds two numbers.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Add_%28block%29'
    },
    {
        type: 'operator_subtract',
        message0: '%1 - %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Subtracts two numbers.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Subtract_%28block%29'
    },
    {
        type: 'operator_multiply',
        message0: '%1 × %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Multiplies two numbers.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Multiply_%28block%29'
    },
    {
        type: 'operator_divide',
        message0: '%1 ÷ %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Divides two numbers.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Divide_%28block%29'
    },
    {
        type: 'operator_random',
        message0: 'pick random %1 to %2',
        args0: [
            { type: 'input_value', name: 'FROM' },
            { type: 'input_value', name: 'TO' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Picks a random number between the specified range.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Pick_Random_%28block%29'
    },
    {
        type: 'operator_gt',
        message0: '%1 > %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Returns true if the first value is greater than the second.',
        helpUrl: ''
    },
    {
        type: 'operator_lt',
        message0: '%1 < %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Returns true if the first value is less than the second.',
        helpUrl: ''
    },
    {
        type: 'operator_equals',
        message0: '%1 = %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Returns true if both values are equal.',
        helpUrl: ''
    },
    {
        type: 'operator_and',
        message0: '%1 and %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
            { type: 'input_value', name: 'OPERAND2', check: 'Boolean' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Returns true if both conditions are true.',
        helpUrl: ''
    },
    {
        type: 'operator_or',
        message0: '%1 or %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
            { type: 'input_value', name: 'OPERAND2', check: 'Boolean' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Returns true if either condition is true.',
        helpUrl: ''
    },
    {
        type: 'operator_not',
        message0: 'not %1',
        args0: [{ type: 'input_value', name: 'OPERAND', check: 'Boolean' }],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Negates a boolean value.',
        helpUrl: ''
    },
    {
        type: 'operator_join',
        message0: 'join %1 %2',
        args0: [
            { type: 'input_value', name: 'STRING1' },
            { type: 'input_value', name: 'STRING2' }
        ],
        output: 'String',
        colour: '#59C059',
        tooltip: 'Combines two strings.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Join_Strings_%28block%29'
    },
    {
        type: 'operator_letter_of',
        message0: 'letter %1 of %2',
        args0: [
            { type: 'input_value', name: 'LETTER' },
            { type: 'input_value', name: 'STRING' }
        ],
        output: 'String',
        colour: '#59C059',
        tooltip: 'Gets a specific letter from a string.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Letter_of_%28block%29'
    },
    {
        type: 'operator_length',
        message0: 'length of %1',
        args0: [{ type: 'input_value', name: 'STRING' }],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Reports the length of a string.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Length_of_String_%28block%29'
    },
    {
        type: 'operator_mod',
        message0: '%1 mod %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Returns the remainder of division.',
        helpUrl: ''
    },
    {
        type: 'operator_round',
        message0: 'round %1',
        args0: [{ type: 'input_value', name: 'NUM' }],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Rounds a number to the nearest integer.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Round_Number_%28block%29'
    },
    {
        type: 'operator_mathop',
        message0: '%1 of %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'OPERATOR',
                options: [
                    ['abs', 'abs'],
                    ['floor', 'floor'],
                    ['ceiling', 'ceiling'],
                    ['sqrt', 'sqrt'],
                    ['sin', 'sin'],
                    ['cos', 'cos'],
                    ['tan', 'tan'],
                    ['asin', 'asin'],
                    ['acos', 'acos'],
                    ['atan', 'atan'],
                    ['ln', 'ln'],
                    ['log', 'log'],
                    ['e^', 'e^'],
                    ['10^', '10^']
                ]
            },
            { type: 'input_value', name: 'NUM' }
        ],
        output: 'Number',
        colour: '#59C059',
        tooltip: 'Performs a mathematical operation.',
        helpUrl: ''
    },
    {
        type: 'operator_contains',
        message0: '%1 contains %2 ?',
        args0: [
            { type: 'input_value', name: 'STRING1' },
            { type: 'input_value', name: 'STRING2' }
        ],
        output: 'Boolean',
        colour: '#59C059',
        tooltip: 'Checks if a string contains a substring.',
        helpUrl: ''
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIABLES (Dynamic blocks - category only; individual variables created at runtime)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'data_setvariableto',
        message0: 'set %1 to %2',
        args0: [
            {
                type: 'field_variable',
                name: 'VARIABLE',
                variable: 'my variable',
                variableTypes: ['Number', 'String', '']
            },
            { type: 'input_value', name: 'VALUE' }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Sets a variable to a specific value.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Set_Variable_to_%28block%29'
    },
    {
        type: 'data_changevariableby',
        message0: 'change %1 by %2',
        args0: [
            {
                type: 'field_variable',
                name: 'VARIABLE',
                variable: 'my variable',
                variableTypes: ['Number', 'String', '']
            },
            { type: 'input_value', name: 'VALUE', check: 'Number' }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Changes a variable by a specified amount.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Change_Variable_by_%28block%29'
    },
    {
        type: 'data_showvariable',
        message0: 'show variable %1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Shows the variable monitor on the stage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Show_Variable_%28block%29'
    },
    {
        type: 'data_hidevariable',
        message0: 'hide variable %1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Hides the variable monitor on the stage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Hide_Variable_%28block%29'
    },
    {
        type: 'data_variable',
        message0: '%1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        output: null,
        colour: '#FF8C1A',
        tooltip: 'Reports the value of a variable.',
        helpUrl: ''
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTS (12 blocks)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'data_addtolist',
        message0: 'add %1 to %2',
        args0: [
            { type: 'input_value', name: 'ITEM' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Adds an item to the end of a list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Add_thing_to_List_%28block%29'
    },
    {
        type: 'data_deleteoflist',
        message0: 'delete %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Deletes an item from a list at a specific index.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Delete_thing_of_List_%28block%29'
    },
    {
        type: 'data_deletealloflist',
        message0: 'delete all of %1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my list',
            variableTypes: ['list'],
            defaultType: 'list'
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Deletes all items from a list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Delete_all_of_List_%28block%29'
    },
    {
        type: 'data_insertatlist',
        message0: 'insert %1 at %2 of %3',
        args0: [
            { type: 'input_value', name: 'ITEM' },
            { type: 'input_value', name: 'INDEX', check: 'Number' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Inserts an item at a specific position in a list.',
        helpUrl: ''
    },
    {
        type: 'data_replaceitemoflist',
        message0: 'replace item %1 of %2 with %3',
        args0: [
            { type: 'input_value', name: 'INDEX', check: 'Number' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            },
            { type: 'input_value', name: 'ITEM' }
        ],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Replaces an item in a list at a specific position.',
        helpUrl: ''
    },
    {
        type: 'data_itemoflist',
        message0: 'item %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            }
        ],
        output: 'String',
        colour: '#FF8C1A',
        tooltip: 'Gets the item at a specific position in a list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Item_of_List_%28block%29'
    },
    {
        type: 'data_itemnumoflist',
        message0: 'item # of %1 in %2',
        args0: [
            { type: 'input_value', name: 'ITEM' },
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            }
        ],
        output: 'Number',
        colour: '#FF8C1A',
        tooltip: 'Reports the index of an item in a list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Item_%23_of_List_%28block%29'
    },
    {
        type: 'data_lengthoflist',
        message0: 'length of %1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my list',
            variableTypes: ['list'],
            defaultType: 'list'
        }],
        output: 'Number',
        colour: '#FF8C1A',
        tooltip: 'Reports the number of items in a list.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Length_of_List_%28block%29'
    },
    {
        type: 'data_listcontainsitem',
        message0: '%1 contains %2 ?',
        args0: [
            {
                type: 'field_variable',
                name: 'LIST',
                variable: 'my list',
                variableTypes: ['list'],
                defaultType: 'list'
            },
            { type: 'input_value', name: 'ITEM' }
        ],
        output: 'Boolean',
        colour: '#FF8C1A',
        tooltip: 'Checks if a list contains a specific item.',
        helpUrl: ''
    },
    {
        type: 'data_showlist',
        message0: 'show list %1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my list',
            variableTypes: ['list'],
            defaultType: 'list'
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Shows the list monitor on the stage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Show_List_%28block%29'
    },
    {
        type: 'data_hidelist',
        message0: 'hide list %1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my list',
            variableTypes: ['list'],
            defaultType: 'list'
        }],
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF8C1A',
        tooltip: 'Hides the list monitor on the stage.',
        helpUrl: 'https://en.leap-wiki.info/wiki/Hide_List_%28block%29'
    },
    // Placeholders for Toolbox/Flyout: replaced by real reporters upon creation in workspace
    {
        type: 'variable_reporter_checkbox',
        message0: '%1 %2',
        args0: [
            { type: 'field_checkbox', name: 'CHECK', checked: false },
            { type: 'field_input', name: 'VARIABLE', text: 'variable', enabled: false }
        ],
        output: 'String',
        colour: '#FF8C1A00',
        tooltip: 'Flyout placeholder'
    },
    {
        type: 'list_reporter_checkbox',
        message0: '%1 %2',
        args0: [
            { type: 'field_checkbox', name: 'CHECK', checked: false },
            { type: 'field_input', name: 'LIST', text: 'list', enabled: false }
        ],
        output: 'String',
        colour: '#FF8C1A00',
        tooltip: 'Flyout placeholder'
    },
    {
        type: 'sensing_reporter_checkbox',
        message0: '%1 %2',
        args0: [
            { type: 'field_checkbox', name: 'CHECK', checked: false },
            { type: 'field_input', name: 'VARIABLE', text: 'sensing', enabled: false }
        ],
        output: 'String',
        colour: '#5CB1D600',
        tooltip: 'Flyout placeholder'
    },
    {
        type: 'data_listcontents',
        message0: '%1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my list',
            variableTypes: ['list'],
            defaultType: 'list'
        }],
        output: 'String',
        colour: '#FF8C1A',
        tooltip: 'Reports the contents of a list.',
        helpUrl: ''
    },
    {
        type: 'data_tablecontents',
        message0: 'table %1',
        args0: [{
            type: 'field_variable',
            name: 'LIST',
            variable: 'my table',
            variableTypes: ['table'],
            defaultType: 'table'
        }],
        output: 'String',
        colour: '#FF8C1A',
        tooltip: 'Reports the contents of a table.',
        helpUrl: ''
    },
    {
        type: 'data_showtable',
        message0: 'show table %1 as %2',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' },
            { type: 'field_dropdown', name: 'FORMAT', options: [['stage', 'stage'], ['bar chart', 'bar'], ['line chart', 'line']] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Shows the table on stage in the specified format.'
    },
    {
        type: 'data_hidetable',
        message0: 'hide table %1',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Hides the table from the stage.'
    },
    {
        type: 'data_setintable',
        message0: 'set in table %1 column %2 row %3 value %4',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' },
            { type: 'field_number', name: 'COLUMN', value: 1, min: 1 },
            { type: 'field_number', name: 'ROW', value: 1, min: 1 },
            { type: 'field_input', name: 'VALUE', text: '0' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Sets a value in the table at the specified column and row.'
    },
    {
        type: 'data_addcolumn',
        message0: 'add column %1 to table %2',
        args0: [
            { type: 'field_input', name: 'COLUMN', text: 'new col' },
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Adds a new column to the table.'
    },
    {
        type: 'data_deletecolumn',
        message0: 'delete column %1 from table %2',
        args0: [
            { type: 'field_number', name: 'COLUMN', value: 1, min: 1 },
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Deletes a column from the table.'
    },
    {
        type: 'data_deleterow',
        message0: 'delete row %1 from table %2',
        args0: [
            { type: 'field_number', name: 'ROW', value: 1, min: 1 },
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Deletes a row from the table.'
    },
    {
        type: 'data_cleartable',
        message0: 'clear table %1',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Clears all data from the table.'
    },
    {
        type: 'data_getvalueattable',
        message0: 'get value at column %1 row %2 from %3',
        args0: [
            { type: 'field_number', name: 'COLUMN', value: 1, min: 1 },
            { type: 'field_number', name: 'ROW', value: 1, min: 1 },
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        output: 'String',
        colour: '#FF8C1A',
        tooltip: 'Reports the value at the specified column and row.'
    },
    {
        type: 'data_gettablecount',
        message0: 'table %1 row count',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        output: 'Number',
        colour: '#FF8C1A',
        tooltip: 'Reports the number of rows in the table.'
    },
    {
        type: 'data_gettimestamp',
        message0: 'get timestamp',
        args0: [],
        output: 'String',
        colour: '#FF8C1A',
        tooltip: 'Reports the current timestamp.'
    },
    {
        type: 'data_exporttable',
        message0: 'export %1 as csv file',
        args0: [
            { type: 'field_variable', name: 'TABLE', variable: 'my table', variableTypes: ['table'], defaultType: 'table' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C1A',
        tooltip: 'Exports the table as a CSV file.'
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MY BLOCKS (Custom procedures)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'procedures_definition',
        message0: 'define %1',
        args0: [{ type: 'field_input', name: 'NAME', text: 'my block' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'custom_block' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6680',
        tooltip: 'Defines a custom block.',
        helpUrl: ''
    },
    {
        type: 'procedures_call',
        message0: '%1',
        args0: [{ type: 'field_dropdown', name: 'PROCCNT', options: [] }], // Populated dynamically
        previousStatement: null,
        nextStatement: 'any',
        colour: '#FF6680',
        tooltip: 'Calls a custom block.',
        helpUrl: ''
    },
    {
        type: 'procedures_declaration',
        // This is an internal block for the procedure prototype
        output: null,
        colour: '#FF6680',
        tooltip: ''
    }
];

// Register all blocks with Blockly

export const registerleapBlocks = () => {
    // Step 1: Force-register ALL blocks (overwrite any clobbered definitions from other modes)
    // Without this, switching from Junior→Intermediate leaves stale Junior block definitions
    // (e.g. looks_say with dropdown instead of input_value) which causes MissingConnection errors.
    Blockly.common.defineBlocksWithJsonArray(leapBlocks);

    // Step 2: Register broadcast blocks imperatively (they need dynamic dropdown + extension)
    const broadcastOptions = () => {
        if (typeof window !== 'undefined' && (window as any).getBroadcastMessages) {
            const msgs = (window as any).getBroadcastMessages();
            if (msgs && msgs.length > 0) {
                const options = msgs.map((m: string) => [m, m]);
                options.push(['New message...', 'new']);
                return options;
            }
        }
        return [['message1', 'message1'], ['New message...', 'new']];
    };
    if (!Blockly.Blocks['event_broadcast_wait']) {
        Blockly.Blocks['event_broadcast_wait'] = {
            init(this: Blockly.Block) {
                this.appendDummyInput()
                    .appendField('📢 broadcast')
                    .appendField(new Blockly.FieldDropdown(broadcastOptions), 'BROADCAST_INPUT')
                    .appendField('and wait');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#FFBF00');
                this.setTooltip('Send message and wait for all handlers to finish');
                Blockly.Extensions.apply('broadcast_dropdown_ext', this, false);
            }
        };
    }
    if (!Blockly.Blocks['event_broadcast']) {
        Blockly.Blocks['event_broadcast'] = {
            init(this: Blockly.Block) {
                this.appendDummyInput()
                    .appendField('📢 broadcast')
                    .appendField(new Blockly.FieldDropdown(broadcastOptions), 'BROADCAST_INPUT');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#FFBF00');
                this.setTooltip('Send a message to all sprites');
                Blockly.Extensions.apply('broadcast_dropdown_ext', this, false);
            }
        };
    }
    if (!Blockly.Blocks['event_receive']) {
        Blockly.Blocks['event_receive'] = {
            init(this: Blockly.Block) {
                this.appendDummyInput()
                    .appendField('📨 when I receive')
                    .appendField(new Blockly.FieldDropdown(broadcastOptions), 'BROADCAST_OPTION');
                this.setNextStatement(true, null);
                this.setColour('#FFBF00');
                this.setTooltip('Runs when message is received');
                Blockly.Extensions.apply('broadcast_dropdown_ext', this, false);
            }
        };
    }
};
// Export block list for toolbox generation
export const getleapBlocks = () => leapBlocks;

export default leapBlocks;
