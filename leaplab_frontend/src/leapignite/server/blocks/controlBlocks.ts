import { getTarget, wait, yieldLoop } from './common';

export function defineControlBlocks(Blockly: any, javascriptGenerator: any): void {
    Blockly.Blocks['control_forever'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔄", "junior-icon")).appendField("Forever");
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_forever'] = (b: any) => {
        const branch = javascriptGenerator.statementToCode(b, 'DO');
        return `while(window.isActive()) {\n${branch}\n${yieldLoop()}}\n`;
    };

    Blockly.Blocks['control_repeat'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔁", "junior-icon")).appendField("Repeat 4");
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_repeat'] = (b: any) => {
        const branch = javascriptGenerator.statementToCode(b, 'DO');
        return `for(let i=0; i<4 && window.isActive(); i++){\n${branch}\n}\n`;
    };

    Blockly.Blocks['control_wait'] = {
        init: function (this: any) {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("⏳", "junior-block-icon"))
                .appendField(new Blockly.FieldNumber(1, 0.1), "SECONDS")
                .appendField("sec");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_wait'] = (block: any) => {
        const seconds = block.getFieldValue("SECONDS");
        return `await window.wait(${seconds});\nif(window.checkPause) await window.checkPause();\nif(!window.isActive()) return;\n`;
    };

    Blockly.Blocks['control_turn'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("↻", "junior-icon")).appendField("Turn");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_turn'] = () => `turnRight(${getTarget()});\n${wait()}`;

    Blockly.Blocks['control_reverse'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("↺", "junior-icon")).appendField("Reverse");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_reverse'] = () => `turnLeft(${getTarget()});\n${wait()}`;

    Blockly.Blocks['control_stop'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("✋", "junior-icon")).appendField("Stop");
            this.setPreviousStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_stop'] = () => 'if(window.pauseExecution) window.pauseExecution();\nif(window.checkPause) await window.checkPause();\n';

    Blockly.Blocks['control_scene'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🚩", "junior-icon")).appendField("Scene");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_scene'] = () => `changeScene();\n${wait()}`;
}
