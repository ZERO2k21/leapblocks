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
            // Dropdown options
            const options = [
                ["Bark", "bark"],
                ["Meow", "meow"],
                ["Pop", "pop"],
                ["Boing", "boing"],
                ["Chirp", "chirp"],
                ["Clap", "clap"],
                ["Snore", "snore"]
            ];
            juniorSoundBase(this, "Play", options, "SOUND");
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

    // --- STOP MUSIC ---
    Blockly.Blocks["sound_stop_music"] = {
        init: function () {
            this.jsonInit({
                "message0": "🔇 Stop Music",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
        }
    };
    javascriptGenerator.forBlock["sound_stop_music"] = function (block) {
        return `stopMusic();\n`;
    };

    // --- PLAY NOTE (Note + Octave) ---
    Blockly.Blocks["sound_note"] = {
        init: function () {
            this.jsonInit({
                "message0": "🎵 %1 octave %2",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "NOTE",
                        "options": [
                            ["C", "C"], ["D", "D"], ["E", "E"], ["F", "F"],
                            ["G", "G"], ["A", "A"], ["B", "B"]
                        ]
                    },
                    {
                        "type": "field_number",
                        "name": "OCTAVE",
                        "value": 4,
                        "min": 1,
                        "max": 7
                    }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
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
                ["🎹 Piano", "piano"],
                ["🎸 Guitar", "guitar"],
                ["🎻 Violin", "violin"],
                ["🥁 Drums", "drums"]
            ];
            juniorSoundBase(this, "🎼", options, "INSTRUMENT");
        }
    };
    javascriptGenerator.forBlock["sound_instrument"] = function (block) {
        const inst = block.getFieldValue("INSTRUMENT");
        return `setInstrument("${inst}");\n`;
    };

    // --- STOP ALL SOUNDS ---
    Blockly.Blocks["sound_stop_all"] = {
        init: function () {
            this.jsonInit({
                "message0": "🔇 Stop All",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#CF63CF"
            });
        }
    };
    javascriptGenerator.forBlock["sound_stop_all"] = function (block) {
        return `stopAllSounds();\n`;
    };
}
