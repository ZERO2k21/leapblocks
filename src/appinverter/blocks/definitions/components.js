/**
 * Component Blocks for App Inventor
 * Includes: set/get properties, call methods
 */
import * as Blockly from 'blockly';

// Set Component Property
Blockly.Blocks['component_set_property'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("set")
            .appendField(new Blockly.FieldDropdown([
                ["Button1", "Button1"],
                ["Label1", "Label1"],
                ["TextBox1", "TextBox1"]
            ]), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldDropdown([
                ["Text", "Text"],
                ["BackgroundColor", "BackgroundColor"],
                ["TextColor", "TextColor"],
                ["FontSize", "FontSize"],
                ["Visible", "Visible"],
                ["Enabled", "Enabled"]
            ]), "PROPERTY")
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
            .appendField(new Blockly.FieldDropdown([
                ["Button1", "Button1"],
                ["Label1", "Label1"],
                ["TextBox1", "TextBox1"]
            ]), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldDropdown([
                ["Text", "Text"],
                ["BackgroundColor", "BackgroundColor"],
                ["TextColor", "TextColor"],
                ["FontSize", "FontSize"],
                ["Visible", "Visible"],
                ["Enabled", "Enabled"],
                ["Width", "Width"],
                ["Height", "Height"]
            ]), "PROPERTY");
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
            .appendField(new Blockly.FieldDropdown([
                ["Button1", "Button1"],
                ["Label1", "Label1"],
                ["Notifier1", "Notifier1"]
            ]), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldDropdown([
                ["ShowAlert", "ShowAlert"],
                ["ShowMessage", "ShowMessage"],
                ["Hide", "Hide"],
                ["Show", "Show"]
            ]), "METHOD");
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
    'component_set_property': Blockly.Blocks['component_set_property'],
    'component_get_property': Blockly.Blocks['component_get_property'],
    'component_method': Blockly.Blocks['component_method'],
    'navigate_screen': Blockly.Blocks['navigate_screen'],
    'close_screen': Blockly.Blocks['close_screen'],
    'notifier_show': Blockly.Blocks['notifier_show'],
    'sound_play': Blockly.Blocks['sound_play'],
    'device_vibrate': Blockly.Blocks['device_vibrate']
};
