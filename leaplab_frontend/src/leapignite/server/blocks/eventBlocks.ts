import { getTarget, wait, MESSAGE_OPTIONS } from './common';

export function defineEventBlocks(Blockly: any, javascriptGenerator: any): void {
    Blockly.Blocks['event_flag'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🚩", "junior-icon-large")).appendField("Start");
            this.setNextStatement(true); this.setColour("#FFBF00"); this.setDeletable(true);
        },
        customContextMenu: function (this: any, options: any[]) {
            options.push({ text: "Delete Block", enabled: true, callback: () => { this.dispose(true); } });
            options.push({ text: "Duplicate", enabled: true, callback: () => {
                const blockXML = Blockly.Xml.blockToDom(this);
                const newBlock = Blockly.Xml.domToBlock(blockXML, this.workspace);
                const xy = this.getRelativeToSurfaceXY();
                newBlock.moveBy(20, 20);
            }});
        }
    };
    javascriptGenerator.forBlock['event_flag'] = () => '// On Flag\n';

    Blockly.Blocks['event_up'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("↑", "junior-icon")).appendField("Event Up");
            this.setNextStatement(true); this.setColour("#FFBF00");
        }
    };
    javascriptGenerator.forBlock['event_up'] = () => '// On Up\n';

    Blockly.Blocks['event_down'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("↓", "junior-icon")).appendField("Event Down");
            this.setNextStatement(true); this.setColour("#FFBF00");
        }
    };
    javascriptGenerator.forBlock['event_down'] = () => '// On Down\n';

    Blockly.Blocks['event_press'] = {
        init: function (this: any) {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("✋", "junior-icon")).appendField("Press");
            this.setNextStatement(true); this.setColour("#FFBF00");
        }
    };
    javascriptGenerator.forBlock['event_press'] = () => '// On Press\n';

    Blockly.Blocks['broadcast_message'] = {
        init: function (this: any) {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📡", "junior-block-icon"))
                .appendField("Send Message")
                .appendField(new Blockly.FieldDropdown(MESSAGE_OPTIONS), "MESSAGE");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFBF00");
        }
    };
    javascriptGenerator.forBlock['broadcast_message'] = (block: any) => `window.broadcastMessage("${block.getFieldValue("MESSAGE")}");\n${wait()}`;

    Blockly.Blocks['when_receive_message'] = {
        init: function (this: any) {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📨", "junior-icon-large"))
                .appendField("On Receive")
                .appendField(new Blockly.FieldDropdown(MESSAGE_OPTIONS), "MESSAGE");
            this.setNextStatement(true); this.setColour("#FFBF00"); this.setDeletable(true);
        }
    };
    javascriptGenerator.forBlock['when_receive_message'] = () => '// On Receive Message\n';
}
