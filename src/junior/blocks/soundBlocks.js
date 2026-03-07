import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

export default function defineSoundBlocks() {

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
            // Dynamic Dropdown options
            const optionsGenerator = function () {
                if (typeof window !== 'undefined' && window.getActiveSpriteSounds) {
                    const dynamicOptions = window.getActiveSpriteSounds();
                    if (dynamicOptions && dynamicOptions.length > 0) {
                        return dynamicOptions;
                    }
                }
                return [
                    ["Pop", "pop"],
                    ["Boing", "boing"],
                    ["Clap", "clap"]
                ];
            };
            juniorSoundBase(this, "Play", optionsGenerator, "SOUND");
        }
    };
    javascriptGenerator.forBlock["sound_play"] = function (block) {
        const sound = block.getFieldValue("SOUND");
        return `playSound("${sound}");\n`;
    };


    // --- PLAY MUSIC ---
    Blockly.Blocks["sound_play_music"] = {
        init: function () {
            const options = [
                ["Music 1", "music_1"],
                ["Music 2", "music_2"],
                ["Music 3", "music_3"]
            ];
            juniorSoundBase(this, "🎵 Play Music", options, "MUSIC");
        }
    };
    javascriptGenerator.forBlock["sound_play_music"] = function (block) {
        const music = block.getFieldValue("MUSIC");
        return `playMusic("${music}");\n`;
    };

    // --- PLAY NOTE (Note + Octave) ---
    Blockly.Blocks["sound_note"] = {
        init: function () {
            this.jsonInit({
                "message0": "%1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "NOTE",
                        "options": [["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"], ["G", "G"], ["A", "A"], ["B", "B"]]
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
            // We'll also store the octave as a hidden field or use a label field that updates.
            // For now, let's keep it simple and add the Label as a dynamic field if possible, 
            // but Blockly.FieldLabel with a function is easier.

            this.appendDummyInput("DISPLAY")
                .appendField(new Blockly.FieldLabel("C(4)"), "PILL");

            // Hide the actual dropdown in the UI if possible, or just use it as the data store.
            // In Junior, we often use FieldLabel for display and hidden fields for data.
            this.getField("NOTE").setVisible(false);

            // Add hidden OCTAVE field
            this.appendDummyInput()
                .appendField(new Blockly.FieldTextInput("4"), "OCTAVE")
                .setVisible(false);
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
            this.jsonInit({
                "message0": "%1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "INSTRUMENT",
                        "options": [
                            ["🎹", "piano"],
                            ["🎹", "organ"],
                            ["🪈", "flute"],
                            ["🎸", "guitar"],
                            ["🎸", "electric_guitar"]
                        ]
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
        }
    };
    javascriptGenerator.forBlock["sound_instrument"] = function (block) {
        const inst = block.getFieldValue("INSTRUMENT");
        return `setInstrument("${inst}");\n`;
    };

    // --- STOP ALL SOUNDS ---
    Blockly.Blocks["sound_stop"] = {
        init: function () {
            this.jsonInit({
                "message0": "🔇 Stop",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
        }
    };
    javascriptGenerator.forBlock["sound_stop"] = function (block) {
        return `stopAllSounds();\n`;
    };
}
