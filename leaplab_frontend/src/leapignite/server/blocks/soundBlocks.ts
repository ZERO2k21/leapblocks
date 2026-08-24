export default function defineSoundBlocks(Blockly: any, javascriptGenerator: any): void {
    if (!Blockly || !javascriptGenerator) return;
    const defaultSoundOptions: Array<[string, string]> = [["Pop", "pop"], ["Boing", "boing"], ["Clap", "clap"]];

    const normalizeDropdownOptions = (options: any, fallbackOptions: Array<[string, string]>): Array<[string, string]> => {
        if (!Array.isArray(options) || options.length === 0) {
            return fallbackOptions;
        }

        const normalizedOptions = options
            .map((option: any) => {
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
                        .replace(/\b\w/g, (char: string) => char.toUpperCase());
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

    const juniorSoundBase = (block: any, icon: string, options: Array<[string, string]>, fieldName: string): void => {
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
            "colour": "#CF63CF",
            "tooltip": "Play a sound",
            "helpUrl": ""
        });
    };

    Blockly.Blocks["sound_play"] = {
        init: function (this: any) {
            const optionsGenerator = function () {
                if (typeof window !== 'undefined' && (window as any).getActiveSpriteSounds) {
                    const dynamicOptions = (window as any).getActiveSpriteSounds();
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
    javascriptGenerator.forBlock["sound_play"] = function (block: any) {
        const sound = block.getFieldValue("SOUND");
        return `playSound("${sound}");\nawait window.wait(0.5);\n`;
    };

    Blockly.Blocks["sound_play_music"] = {
        init: function (this: any) {
            const options: Array<[string, string]> = [["1", "music_1"], ["2", "music_2"], ["3", "music_3"]];
            this.appendDummyInput()
                .appendField("🎵 Play Music")
                .appendField(new Blockly.FieldDropdown(options), "MUSIC");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_play_music"] = function (block: any) {
        const music = block.getFieldValue("MUSIC");
        return `playMusic("${music}");\nawait window.wait(1);\n`;
    };

    Blockly.Blocks["sound_note"] = {
        init: function (this: any) {
            this.appendDummyInput("SPACER")
                .appendField(" ");

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
        onchange: function (this: any) {
            const note = this.getFieldValue("NOTE");
            const octave = this.getFieldValue("OCTAVE");
            this.setFieldValue(`${note}(${octave})`, "PILL");
        }
    };
    javascriptGenerator.forBlock["sound_note"] = function (block: any) {
        const note = block.getFieldValue("NOTE");
        const octave = block.getFieldValue("OCTAVE");
        return `playNote("${note}", ${octave}, 0.5);\nawait window.wait(0.5);\n`;
    };

    Blockly.Blocks["sound_instrument"] = {
        init: function (this: any) {
            const options: Array<[string, string]> = [
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
    javascriptGenerator.forBlock["sound_instrument"] = function (block: any) {
        const inst = block.getFieldValue("INSTRUMENT");
        return `setInstrument("${inst}");\n`;
    };

    Blockly.Blocks["sound_stop"] = {
        init: function (this: any) {
            this.appendDummyInput().appendField("🔇 Stop");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock["sound_stop"] = function (block: any) { return `stopAllSounds();\n`; };

    Blockly.Blocks['sound_record'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("📢", "junior-icon")).appendField("Record"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_record'] = () => `showFeedback("Recording...");\nawait window.wait(0.5);\n`;

    Blockly.Blocks['sound_vol'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Volume"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_vol'] = () => `showFeedback("Volume Changed");\nawait window.wait(0.5);\n`;

    Blockly.Blocks['sound_animal'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Sound of").appendField(new Blockly.FieldDropdown([["Bear", "grunt"], ["Dog", "bark"], ["Cat", "meow"], ["Robot", "robot"]]), "VAL");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock['sound_animal'] = (b: any) => `playSound("${b.getFieldValue('VAL')}");\nawait window.wait(0.5);\n`;

    Blockly.Blocks['sound_music'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Play Note"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_music'] = () => `playNote();\nawait window.wait(0.5);\n`;

    Blockly.Blocks['sound_mute'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Mute"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_mute'] = () => `showFeedback("Muted");\nawait window.wait(0.5);\n`;
}
