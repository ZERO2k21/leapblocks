/**
 * Component Blocks for App Inventor
 * Includes: set/get properties, call methods
 */
import * as Blockly from 'blockly';

Blockly.Blocks['component_event'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('when')
            .appendField(new Blockly.FieldTextInput('Button1'), 'COMPONENT')
            .appendField('.')
            .appendField(new Blockly.FieldTextInput('Click'), 'EVENT');
        this.appendStatementInput('DO')
            .setCheck(null)
            .appendField('do');
        this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
        this.setColour(230);
        this.setTooltip('Handle component event');
    }
};

// Set Component Property
Blockly.Blocks['component_set_property'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("set")
            .appendField(new Blockly.FieldTextInput('Button1'), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldTextInput('Text'), "PROPERTY")
            .appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setTooltip("Set component property");
        this.setHelpUrl("");
    }
};

// Get Component Property
Blockly.Blocks['component_get_property'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput('Button1'), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldTextInput('Text'), "PROPERTY");
        this.setOutput(true, null);
        this.setColour(160);
        this.setTooltip("Get component property");
        this.setHelpUrl("");
    }
};

// Call Component Method
Blockly.Blocks['component_method'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldTextInput('Notifier1'), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldTextInput('ShowAlert'), "METHOD");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Call component method");
    }
};

// Navigate to Screen
Blockly.Blocks['navigate_screen'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("open screen")
            .appendField(new Blockly.FieldDropdown([
                ["Screen1", "Screen1"],
                ["Screen2", "Screen2"]
            ]), "SCREEN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Navigate to another screen");
    }
};

// Close Screen
Blockly.Blocks['close_screen'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("close screen");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Close current screen");
    }
};

// Show Notifier
Blockly.Blocks['notifier_show'] = {
    init: function () {
        this.appendValueInput("MESSAGE")
            .setCheck("String")
            .appendField("show alert");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Show alert message");
    }
};

// Play Sound
Blockly.Blocks['sound_play'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("play sound")
            .appendField(new Blockly.FieldDropdown([
                ["Sound1", "Sound1"],
                ["Sound2", "Sound2"]
            ]), "SOUND");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Play sound");
    }
};

// Vibrate
Blockly.Blocks['device_vibrate'] = {
    init: function () {
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField("vibrate for");
        this.appendDummyInput()
            .appendField("milliseconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Vibrate device");
    }
};

export default {
    'component_event': Blockly.Blocks['component_event'],
    'component_set_property': Blockly.Blocks['component_set_property'],
    'component_get_property': Blockly.Blocks['component_get_property'],
    'component_method': Blockly.Blocks['component_method'],
    'navigate_screen': Blockly.Blocks['navigate_screen'],
    'close_screen': Blockly.Blocks['close_screen'],
    'notifier_show': Blockly.Blocks['notifier_show'],
    'sound_play': Blockly.Blocks['sound_play'],
    'device_vibrate': Blockly.Blocks['device_vibrate']
};
