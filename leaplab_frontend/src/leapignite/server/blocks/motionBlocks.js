import {
    getTarget, wait, MOVE_OPTIONS, TURN_OPTIONS,
    DIRECTION_SYMBOLS, GRID_DEFAULT_X, GRID_DEFAULT_Y,
    formatGridLabel, normalizeDirection, juniorBlockBase,
    getFieldDirectionPickerClass
} from './common';

export function defineMotionBlocks(Blockly, javascriptGenerator) {
    Blockly.Blocks['move_right'] = { init: function () { juniorBlockBase(Blockly, this, "→", "STEPS", MOVE_OPTIONS); } };
    javascriptGenerator.forBlock['move_right'] = (block) => `moveRelative(${getTarget()}, "RIGHT", ${block.getFieldValue("STEPS")});\n${wait()}`;

    Blockly.Blocks['move_left'] = { init: function () { juniorBlockBase(Blockly, this, "←", "STEPS", MOVE_OPTIONS); } };
    javascriptGenerator.forBlock['move_left'] = (block) => `moveRelative(${getTarget()}, "LEFT", ${block.getFieldValue("STEPS")});\n${wait()}`;

    Blockly.Blocks['move_up'] = { init: function () { juniorBlockBase(Blockly, this, "↑", "STEPS", MOVE_OPTIONS); } };
    javascriptGenerator.forBlock['move_up'] = (block) => `moveRelative(${getTarget()}, "UP", ${block.getFieldValue("STEPS")});\n${wait()}`;

    Blockly.Blocks['move_down'] = { init: function () { juniorBlockBase(Blockly, this, "↓", "STEPS", MOVE_OPTIONS); } };
    javascriptGenerator.forBlock['move_down'] = (block) => `moveRelative(${getTarget()}, "DOWN", ${block.getFieldValue("STEPS")});\n${wait()}`;

    Blockly.Blocks['turn_right'] = { init: function () { juniorBlockBase(Blockly, this, "↻", "TIMES", TURN_OPTIONS); } };
    javascriptGenerator.forBlock['turn_right'] = (block) => `turnRight(${getTarget()}, ${block.getFieldValue("TIMES")});\n${wait()}`;

    Blockly.Blocks['turn_left'] = { init: function () { juniorBlockBase(Blockly, this, "↺", "TIMES", TURN_OPTIONS); } };
    javascriptGenerator.forBlock['turn_left'] = (block) => `turnLeft(${getTarget()}, ${block.getFieldValue("TIMES")});\n${wait()}`;

    Blockly.Blocks['jump'] = { init: function () { juniorBlockBase(Blockly, this, "⤴", "TIMES", [["1", "1"], ["2", "2"], ["3", "3"]]); } };
    javascriptGenerator.forBlock['jump'] = (block) => `jump(${getTarget()}, ${block.getFieldValue("TIMES")});\n${wait()}`;

    Blockly.Blocks['run'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("→", "junior-icon")).appendField("Run"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#4C97FF"); } };
    javascriptGenerator.forBlock['run'] = () => `run(${getTarget()});\n${wait()}`;

    Blockly.Blocks['findout'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧭", "junior-icon")).appendField("Findout"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#4C97FF"); } };
    javascriptGenerator.forBlock['findout'] = () => `findout(${getTarget()});\n${wait()}`;

    Blockly.Blocks['go_to_location'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📍", "junior-icon-large"))
                .appendField("Go to")
                .appendField(new Blockly.FieldLabel(formatGridLabel(GRID_DEFAULT_X, GRID_DEFAULT_Y), "junior-inline-pill"), "POSITION");
            this.setPreviousStatement(true); this.setNextStatement(true);
            this.setColour("#4C97FF");
            this.posX = GRID_DEFAULT_X; this.posY = GRID_DEFAULT_Y;
            this.setGridPosition = (x, y) => {
                this.posX = Number.isFinite(Number(x)) ? Number(x) : GRID_DEFAULT_X;
                this.posY = Number.isFinite(Number(y)) ? Number(y) : GRID_DEFAULT_Y;
                this.setFieldValue(formatGridLabel(this.posX, this.posY), "POSITION");
            };
            this.saveExtraState = () => ({ posX: this.posX, posY: this.posY });
            this.loadExtraState = (state) => { this.setGridPosition(state?.posX ?? GRID_DEFAULT_X, state?.posY ?? GRID_DEFAULT_Y); };
        }
    };
    javascriptGenerator.forBlock['go_to_location'] = (block) => {
        const x = Number.isFinite(Number(block.posX)) ? Number(block.posX) : GRID_DEFAULT_X;
        const y = Number.isFinite(Number(block.posY)) ? Number(block.posY) : GRID_DEFAULT_Y;
        return `goToLocation(${x}, ${y});\n${wait()}`;
    };

    Blockly.Blocks["move_relative"] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📍", "junior-icon-large"))
                .appendField("Move")
                .appendField(new Blockly.FieldLabel(DIRECTION_SYMBOLS.RIGHT, "junior-inline-pill"), "DIR_DISPLAY");
            this.setPreviousStatement(true); this.setNextStatement(true);
            this.setColour("#4C97FF");
            this.direction = "RIGHT";
            this.setDirection = (direction) => {
                this.direction = normalizeDirection(direction);
                this.setFieldValue(DIRECTION_SYMBOLS[this.direction], "DIR_DISPLAY");
            };
            this.getDirection = () => normalizeDirection(this.direction);
            this.saveExtraState = () => ({ direction: this.direction });
            this.loadExtraState = (state) => { this.setDirection(state?.direction ?? "RIGHT"); };
        },
    };
    javascriptGenerator.forBlock["move_relative"] = function (block) {
        const direction = block.getDirection ? block.getDirection() : normalizeDirection(block.direction);
        return `moveRelative(${getTarget()}, "${direction}");\n${wait()}`;
    };

    Blockly.Blocks['go_random'] = {
        init: function () {
            const FDP = getFieldDirectionPickerClass();
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🎲", "junior-block-icon"))
                .appendField(new FDP('CENTER'), 'DIRECTION');
            this.setPreviousStatement(true); this.setNextStatement(true);
            this.setColour("#4C97FF");
            this.setTooltip("Move sprite randomly within selected zone");
        }
    };
    javascriptGenerator.forBlock['go_random'] = (block) => {
        const dir = block.getFieldValue('DIRECTION') || 'CENTER';
        const zones = { TOP: [1, 20, 11, 15], LEFT: [1, 6, 1, 15], CENTER: [7, 14, 5, 11], RIGHT: [15, 20, 1, 15], BOTTOM: [1, 20, 1, 5] };
        const [xMin, xMax, yMin, yMax] = zones[dir];
        return `if(!window.isActive()) return;\nwindow.moveRandom(${getTarget()}, ${xMin}, ${xMax}, ${yMin}, ${yMax});\n${wait()}`;
    };

    Blockly.Blocks['change_speed'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("⏱️", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Slow", "slow"], ["Normal", "normal"], ["Fast", "fast"]]), "SPEED");
            this.setPreviousStatement(true); this.setNextStatement(true);
            this.setColour("#4C97FF");
        }
    };
    javascriptGenerator.forBlock['change_speed'] = (block) => `setSpeed("${block.getFieldValue("SPEED")}");\n${wait()}`;
}
