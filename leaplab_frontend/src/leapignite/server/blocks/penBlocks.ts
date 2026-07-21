import { getTarget, wait } from './common';

export function definePenBlocks(Blockly: any, javascriptGenerator: any): void {
    Blockly.Blocks['pen_down'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("✏️", "junior-icon")).appendField("Pen Down"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_down'] = () => `penDown(${getTarget()});\n${wait()}`;

    Blockly.Blocks['pen_up'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("✒️", "junior-icon")).appendField("Pen Up"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_up'] = () => `penUp(${getTarget()});\n${wait()}`;

    Blockly.Blocks['pen_eraser'] = { init: function (this: any) { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧹", "junior-icon")).appendField("Eraser"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_eraser'] = () => `if(window.clearPen) window.clearPen();\n${wait()}`;

    Blockly.Blocks['pen_stamp'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🖼️", "junior-block-icon")).appendField("Stamp");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_stamp'] = () => `stampSprite(${getTarget()});\n${wait()}`;

    Blockly.Blocks['pen_set_color'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🎨", "junior-block-icon")).appendField(new Blockly.FieldDropdown([["Red", "#FF0000"], ["Blue", "#0000FF"], ["Green", "#00FF00"], ["Yellow", "#FFFF00"], ["Purple", "#9966FF"]]), "COLOR");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_set_color'] = (block: any) => `setPenColor("${block.getFieldValue("COLOR")}");\n${wait()}`;

    Blockly.Blocks['pen_set_size'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("📏", "junior-block-icon")).appendField(new Blockly.FieldDropdown([["Thin", "2"], ["Normal", "5"], ["Thick", "10"]]), "SIZE");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_set_size'] = (block: any) => `setPenSize(${block.getFieldValue("SIZE")});\n${wait()}`;
}
