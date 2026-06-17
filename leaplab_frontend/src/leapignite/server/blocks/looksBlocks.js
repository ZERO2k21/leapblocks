/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

export default function defineLooksBlocks(Blockly, javascriptGenerator) {
    // Helper to get target code
    const getTarget = () => 'window.activeSpriteId || "robot_default"';
    const wait = () => 'await window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\n';

    // Helper for Vertical Junior Blocks (Icon Top, Input Bottom)
    function juniorLooksBase(block, iconChar, inputField, inputName) {
        // Row 1: Icon
        block.appendDummyInput()
            .appendField(new Blockly.FieldLabel(iconChar, "junior-icon-large"))
            .setAlign(Blockly.ALIGN_CENTRE);

        // Row 2: Input (if any)
        if (inputField) {
            block.appendDummyInput()
                .appendField(inputField, inputName)
                .setAlign(Blockly.ALIGN_CENTRE);
        }

        block.setPreviousStatement(true);
        block.setNextStatement(true);
        block.setColour("#9966FF"); // Purple
    }

    /* ===== SAY BLOCK (Text Input) ===== */
    Blockly.Blocks["say_text"] = {
        init: function () {
            // Changed from Dropdown to TextInput for better interactivity
            const textInput = new Blockly.FieldTextInput("Hello!");
            juniorLooksBase(this, "Say", textInput, "TEXT");
        },
    };
    javascriptGenerator.forBlock["say_text"] = function (block) {
        const text = block.getFieldValue("TEXT");
        return `say(${getTarget()}, "${text}");\n${wait()}`;
    };

    /* ===== SHOW (Icon Only) ===== */
    Blockly.Blocks["show_sprite"] = {
        init: function () {
            juniorLooksBase(this, "Show");
        },
    };
    javascriptGenerator.forBlock["show_sprite"] = () => `setVisible(${getTarget()}, true);\n${wait()}`;

    /* ===== HIDE (Icon Only) ===== */
    Blockly.Blocks["hide_sprite"] = {
        init: function () {
            juniorLooksBase(this, "Hide");
        },
    };
    javascriptGenerator.forBlock["hide_sprite"] = () => `setVisible(${getTarget()}, false);\n${wait()}`;
    /* ===== CHANGE COSTUME (Icon Only) ===== */
    Blockly.Blocks["junior_change_costume"] = {
        init: function () {
            juniorLooksBase(this, "Next Costume");
        },
    };
    javascriptGenerator.forBlock["junior_change_costume"] = () => `nextCostume();\n${wait()}`;
    /* ===== CHANGE SIZE (Dropdown: Grow/Shrink) ===== */
    Blockly.Blocks["change_size"] = {
        init: function () {
            const dropdown = new Blockly.FieldDropdown([
                ["Grow", "10"],
                ["Shrink", "-10"],
                ["Reset", "reset"]
            ]);
            juniorLooksBase(this, "Size", dropdown, "AMOUNT");
        },
    };
    javascriptGenerator.forBlock["change_size"] = function (block) {
        const amt = block.getFieldValue("AMOUNT");
        if (amt === "reset") return `setSize(${getTarget()}, 100);\n${wait()}`;
        return `changeSize(${getTarget()}, ${amt});\n${wait()}`;
    };

    /* ===== SET SIZE (Number Input: Absolute Size) ===== */
    Blockly.Blocks["set_size"] = {
        init: function () {
            const sizeInput = new Blockly.FieldNumber(100, 1, 500, 1);
            juniorLooksBase(this, "📏", sizeInput, "SIZE");
        },
    };
    javascriptGenerator.forBlock["set_size"] = function (block) {
        const size = block.getFieldValue("SIZE");
        return `setSize(${getTarget()}, ${size});\n${wait()}`;
    };

    /* ===== SELECT SPRITE (Dropdown) ===== */
    Blockly.Blocks["select_sprite"] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.sprites.length > 0) {
                        return data.sprites.map(sprite => [sprite.name, sprite.id]);
                    }
                }
                return [["Robot", "robot_default"]]; // Fallback
            });
            juniorLooksBase(this, "→", dynamicDropdown, "SPRITE");
        },
    };
    javascriptGenerator.forBlock["select_sprite"] = function (block) {
        const sprite = block.getFieldValue("SPRITE");
        return `selectSprite("${sprite}");\n${wait()}`;
    };

    /* ===== SWITCH SCENE (Dropdown) ===== */
    Blockly.Blocks["switch_scene"] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                const options = [["Next Scene", "next"]];
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.scenes && data.scenes.length > 0) {
                        data.scenes.forEach(scene => {
                            options.push([scene.name, scene.id]);
                        });
                    }
                }
                if (options.length === 1) {
                    options.push(["Scene 1", "scene1"]);
                }
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
}
