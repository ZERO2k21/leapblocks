
export default function defineLooksBlocks(Blockly, javascriptGenerator) {
    // Helper to get target code
    const getTarget = () => 'window.activeSpriteId || "teddy"';
    const wait = () => 'await window.wait(0.5);\n';

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

    /* ===== SELECT SPRITE (Dropdown) ===== */
    Blockly.Blocks["select_sprite"] = {
        init: function () {
            const dropdown = new Blockly.FieldDropdown([
                ["Teddy", "teddy"],
                ["Dog", "dog"],
                ["Cat", "cat"]
            ]);
            juniorLooksBase(this, "→", dropdown, "SPRITE");
        },
    };
    javascriptGenerator.forBlock["select_sprite"] = function (block) {
        const sprite = block.getFieldValue("SPRITE");
        return `selectSprite("${sprite}");\n${wait()}`;
    };

    /* ===== SWITCH SCENE (Dropdown) ===== */
    Blockly.Blocks["switch_scene"] = {
        init: function () {
            const dropdown = new Blockly.FieldDropdown([
                ["Next Scene", "next"],
                ["Scene 1", "scene1"],
                ["Scene 2", "scene2"],
                ["Scene 3", "scene3"]
            ]);
            juniorLooksBase(this, "🏞️", dropdown, "SCENE");
        },
    };
    javascriptGenerator.forBlock["switch_scene"] = function (block) {
        const scene = block.getFieldValue("SCENE");
        if (scene === "next") return `changeScene();\n${wait()}`;
        return `switchScene("${scene}");\n${wait()}`;
    };
}
