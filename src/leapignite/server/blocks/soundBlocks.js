/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from "../../../leapembed/server/blockly/runtime";
import { javascriptGenerator } from "../../../leapembed/server/blockly/runtime";

export default function defineSoundBlocks() {
    const defaultSoundOptions = [["Pop", "pop"], ["Boing", "boing"], ["Clap", "clap"]];

    const normalizeDropdownOptions = (options, fallbackOptions) => {
        if (!Array.isArray(options) || options.length === 0) {
            return fallbackOptions;
        }

        const normalizedOptions = options
            .map(option => {
                if (option === "separator") {
                    return option;
                }

                if (Array.isArray(option)) {
                    if (option.length >= 2) {
                        return [String(option[0]), String(option[1])];
                    }

                    if (option.length === 1) {
                        return [String(option[0]), String(option[0])];
                    }
                }

                if (typeof option === "string") {
                    const label = option
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, char => char.toUpperCase());
                    return [label, option];
                }

                if (option && typeof option === "object") {
                    const label = option.label ?? option.text ?? option.name ?? option.value ?? option.id;
                    const value = option.value ?? option.id ?? option.name ?? option.label ?? option.text;

                    if (label != null && value != null) {
                        return [String(label), String(value)];
                    }
                }

                return null;
            })
            .filter(Boolean);

        return normalizedOptions.length > 0 ? normalizedOptions : fallbackOptions;
    };

    // Helper for base style
    const juniorSoundBase = (block, icon, options, fieldName) => {
        block.jsonInit({
            "message0": `${icon} %1`,
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": fieldName,
                    "options": options
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#CF63CF", // Sound Pink
            "tooltip": "Play a sound",
            "helpUrl": ""
        });
    };

    // --- PLAY SOUND (Dynamic Source) ---
    Blockly.Blocks["sound_play"] = {
        init: function () {
            const optionsGenerator = function () {
                if (typeof window !== 'undefined' && window.getActiveSpriteSounds) {
                    const dynamicOptions = window.getActiveSpriteSounds();
                    if (dynamicOptions && dynamicOptions.length > 0) {
                        return normalizeDropdownOptions(dynamicOptions, defaultSoundOptions);
                    }
                }
                return defaultSoundOptions;
            };

            this.appendDummyInput()
                .appendField("Play")
                .appendField(new Blockly.FieldDropdown(optionsGenerator), "SOUND");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_play"] = function (block) {
        const sound = block.getFieldValue("SOUND");
        return `playSound("${sound}");\n`;
    };

    // --- PLAY MUSIC ---
    Blockly.Blocks["sound_play_music"] = {
        init: function () {
            const options = [["1", "music_1"], ["2", "music_2"], ["3", "music_3"]];
            this.appendDummyInput()
                .appendField("🎵 Play Music Music")
                .appendField(new Blockly.FieldDropdown(options), "MUSIC");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_play_music"] = function (block) {
        const music = block.getFieldValue("MUSIC");
        return `playMusic("${music}");\n`;
    };

    // --- PLAY NOTE (Note + Octave) ---
    Blockly.Blocks["sound_note"] = {
        init: function () {
            this.appendDummyInput("SPACER")
                .appendField(" "); // Add some vertical space if needed, 
            // though CSS usually handles height.

            this.appendDummyInput("DISPLAY")
                .appendField(new Blockly.FieldLabel("C(4)"), "PILL");

            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["G", "G"], ["A", "A"], ["B", "B"]]), "NOTE")
                .setVisible(false);

            this.appendDummyInput()
                .appendField(new Blockly.FieldTextInput("4"), "OCTAVE")
                .setVisible(false);

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        },
        onchange: function () {
            const note = this.getFieldValue("NOTE");
            const octave = this.getFieldValue("OCTAVE");
            this.setFieldValue(`${note}(${octave})`, "PILL");
        }
    };
    javascriptGenerator.forBlock["sound_note"] = function (block) {
        const note = block.getFieldValue("NOTE");
        const octave = block.getFieldValue("OCTAVE");
        return `playNote("${note}", ${octave}, 0.5);\n`;
    };

    // --- SET INSTRUMENT ---
    Blockly.Blocks["sound_instrument"] = {
        init: function () {
            const options = [
                ["🎹", "piano"],
                ["🎛️", "organ"],
                ["🪈", "flute"],
                ["🎸", "guitar"],
                ["🎸", "electric_guitar"]
            ];
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(options), "INSTRUMENT");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_instrument"] = function (block) {
        const inst = block.getFieldValue("INSTRUMENT");
        return `setInstrument("${inst}");\n`;
    };

    // --- STOP ALL SOUNDS ---
    Blockly.Blocks["sound_stop"] = {
        init: function () {
            this.appendDummyInput()
                .appendField("🔇 Stop");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_stop"] = function (block) {
        return `stopAllSounds();\n`;
    };
}
