import { getTarget, wait, EMOJI_OPTIONS } from './common';

export default function defineLooksBlocks(Blockly, javascriptGenerator) {
    if (!Blockly || !javascriptGenerator) return;

    function juniorLooksBase(block, iconChar, inputField, inputName) {
        block.appendDummyInput()
            .appendField(new Blockly.FieldLabel(iconChar, "junior-icon-large"))
            .setAlign(Blockly.ALIGN_CENTRE);
        if (inputField) {
            block.appendDummyInput()
                .appendField(inputField, inputName)
                .setAlign(Blockly.ALIGN_CENTRE);
        }
        block.setPreviousStatement(true);
        block.setNextStatement(true);
        block.setColour("#9966FF");
    }
    Blockly.Blocks["say_text"] = {
        init: function () {
            juniorLooksBase(this, "Say", new Blockly.FieldTextInput("Hello!"), "TEXT");
        },
    };
    javascriptGenerator.forBlock["say_text"] = function (block) {
        return `say(${getTarget()}, "${block.getFieldValue("TEXT")}");\n${wait()}`;
    };

    Blockly.Blocks["show_sprite"] = { init: function () { juniorLooksBase(this, "Show"); } };
    javascriptGenerator.forBlock["show_sprite"] = () => `setVisible(${getTarget()}, true);\n${wait()}`;

    Blockly.Blocks["hide_sprite"] = { init: function () { juniorLooksBase(this, "Hide"); } };
    javascriptGenerator.forBlock["hide_sprite"] = () => `setVisible(${getTarget()}, false);\n${wait()}`;

    Blockly.Blocks["junior_change_costume"] = { init: function () { juniorLooksBase(this, "Next Costume"); } };
    javascriptGenerator.forBlock["junior_change_costume"] = () => `nextCostume();\n${wait()}`;

    Blockly.Blocks["change_size"] = {
        init: function () {
            juniorLooksBase(this, "Size", new Blockly.FieldDropdown([["Grow", "10"], ["Shrink", "-10"], ["Reset", "reset"]]), "AMOUNT");
        },
    };
    javascriptGenerator.forBlock["change_size"] = function (block) {
        const amt = block.getFieldValue("AMOUNT");
        if (amt === "reset") return `setSize(${getTarget()}, 100);\n${wait()}`;
        return `changeSize(${getTarget()}, ${amt});\n${wait()}`;
    };

    Blockly.Blocks["set_size"] = { init: function () { juniorLooksBase(this, "📏", new Blockly.FieldNumber(100, 1, 500, 1), "SIZE"); } };
    javascriptGenerator.forBlock["set_size"] = function (block) {
        return `setSize(${getTarget()}, ${block.getFieldValue("SIZE")});\n${wait()}`;
    };

    Blockly.Blocks["select_sprite"] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.sprites.length > 0) {
                        return data.sprites.map(sprite => [sprite.name, sprite.id]);
                    }
                }
                return [["Robot", "robot_default"]];
            });
            juniorLooksBase(this, "→", dynamicDropdown, "SPRITE");
        },
    };
    javascriptGenerator.forBlock["select_sprite"] = function (block) {
        return `selectSprite("${block.getFieldValue("SPRITE")}");\n${wait()}`;
    };

    Blockly.Blocks["switch_scene"] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                const options = [["Next Scene", "next"]];
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.scenes && data.scenes.length > 0) {
                        data.scenes.forEach(scene => { options.push([scene.name, scene.id]); });
                    }
                }
                if (options.length === 1) options.push(["Scene 1", "scene1"]);
                return options;
            });
            juniorLooksBase(this, "🏞️", dynamicDropdown, "SCENE");
        },
    };
    javascriptGenerator.forBlock["switch_scene"] = function (block) {
        const scene = block.getFieldValue("SCENE");
        if (scene === "next") return `changeScene();\n${wait()}`;
        return `switchScene("${scene}");\n${wait()}`;
    };

    // Legacy looks blocks (from blocks.js)
    Blockly.Blocks['looks_say'] = {
        init: function () {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("💬", "junior-icon")).appendField("Say").appendField(new Blockly.FieldDropdown(EMOJI_OPTIONS), "MSG");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_say'] = (block) => `say(${getTarget()}, ${JSON.stringify(block.getFieldValue('MSG') || block.getFieldValue('MESSAGE') || "")});\n${wait()}`;

    Blockly.Blocks['looks_show'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("👁", "junior-icon")).appendField("Visible"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_show'] = () => `setVisible(${getTarget()}, true);\n${wait()}`;

    Blockly.Blocks['looks_hide'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🙈", "junior-icon")).appendField("Hide"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_hide'] = () => `setVisible(${getTarget()}, false);\n${wait()}`;

    Blockly.Blocks['looks_grow'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("⊕", "junior-icon")).appendField("Enlarge"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_grow'] = () => `changeSize(${getTarget()}, 10);\n${wait()}`;

    Blockly.Blocks['looks_shrink'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("⊖", "junior-icon")).appendField("Zoomout"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_shrink'] = () => `changeSize(${getTarget()}, -10);\n${wait()}`;

    Blockly.Blocks['looks_turn_back'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↩", "junior-icon")).appendField("Turn Back"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_turn_back'] = () => `turnLeft(${getTarget()}); turnLeft(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_walk'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("→", "junior-icon")).appendField("Walk"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_walk'] = () => `moveForward(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_symmetry'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧭", "junior-icon")).appendField("Symmetry"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_symmetry'] = () => `symmetry(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_call'] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.sprites.length > 0) return data.sprites.map(sprite => [sprite.name, sprite.name]);
                }
                return [["Teddy", "Teddy"]];
            });
            this.appendDummyInput().appendField(new Blockly.FieldLabel("📢", "junior-icon")).appendField("Call").appendField(dynamicDropdown, "NAME");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_call'] = (block) => `say(${getTarget()}, "Hello ${block.getFieldValue('NAME')}!");\n${wait()}`;

    Blockly.Blocks['looks_reset_size'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↩️", "junior-block-icon")).appendField("Reset Size"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_reset_size'] = () => `resetSize(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_next_costume'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("👔", "junior-block-icon")).appendField("Next Costume"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_next_costume'] = () => `nextCostume(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_change_costume'] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.activeSpriteId) {
                        const sprite = data.sprites.find(s => s.id === data.activeSpriteId);
                        if (sprite && sprite.costumes) return Object.keys(sprite.costumes).map(key => [key.charAt(0).toUpperCase() + key.slice(1), key]);
                    }
                }
                return [["Default", "default"]];
            });
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🎭", "junior-block-icon")).appendField(dynamicDropdown, "COSTUME");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_change_costume'] = (block) => `changeCostume(${getTarget()}, "${block.getFieldValue("COSTUME")}");\n${wait()}`;

    Blockly.Blocks['looks_mirror'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↔️", "junior-block-icon")).appendField("Mirror"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_mirror'] = () => `mirrorSprite(${getTarget()});\n${wait()}`;
}
