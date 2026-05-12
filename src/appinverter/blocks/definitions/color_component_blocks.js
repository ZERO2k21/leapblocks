/**
 * MIT App Inventor Color and Component Blocks
 */
import * as Blockly from 'blockly';
import { FieldColour } from '@blockly/field-colour';
import { BLOCK_COLORS } from '../utils/blockColors';
import { COMPONENT_METADATA as COMPONENT_DATABASE } from '../../data/componentMetadata';

// ============================================================================
// HELPER FUNCTIONS FOR DYNAMIC DROPDOWNS
// ============================================================================

const getComponentInstances = (typeName, currentValue, block) => {
    // If we have a block, use its internal state if currentValue is not provided
    const val = currentValue || block?.instanceName;
    const components = window.LeapLab_Components || [];
    const instances = components
        .filter(c => c.type === typeName)
        .map(c => [c.id, c.id]);
    
    if (typeName === 'Screen' && window.LeapLab_ActiveScreen) {
        if (!instances.some(i => i[1] === window.LeapLab_ActiveScreen.id)) {
            instances.unshift([window.LeapLab_ActiveScreen.id, window.LeapLab_ActiveScreen.id]);
        }
    }

    // Ensure val is in the list to avoid validation errors
    if (val && !instances.some(i => i[1] === val)) {
        instances.push([val, val]);
    }
    
    return instances.length > 0 ? instances : [['(none)', '']];
};

const getComponentEvents = (typeName) => {
    const metadata = COMPONENT_DATABASE[typeName];
    if (!metadata || !metadata.events) return [['Event', 'Event']];
    return metadata.events.map(e => [e.name, e.name]);
};

const getComponentMethods = (typeName) => {
    const metadata = COMPONENT_DATABASE[typeName];
    if (!metadata || !metadata.methods) return [['Method', 'Method']];
    return metadata.methods.map(m => [m.name, m.name]);
};

const getComponentProperties = (typeName, currentValue, block) => {
    const val = currentValue || block?.propertyName;
    const metadata = COMPONENT_DATABASE[typeName];
    if (!metadata || !metadata.properties) return [[val || 'Property', val || 'Property']];
    const options = metadata.properties.map(p => [p.name, p.name]);
    
    if (val && !options.some(i => i[1] === val)) {
        options.push([val, val]);
    }
    return options;
};

// ============================================================================
// COLOR BLOCKS
// ============================================================================

// color picker block
Blockly.Blocks['colour_picker'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.colors);
        this.appendDummyInput()
            .appendField(new FieldColour('#ff0000'), 'COLOUR');
        this.setOutput(true, 'Color');
        this.setTooltip('Click to select a color.');
    }
};

// random color block
Blockly.Blocks['colour_random'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.colors);
        this.appendDummyInput()
            .appendField('random color');
        this.setOutput(true, 'Color');
        this.setTooltip('Returns a random color.');
    }
};

// make color (RGB) block
Blockly.Blocks['colour_rgb'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.colors);
        this.appendValueInput('RED')
            .setCheck('Number')
            .appendField('make color');
        this.appendValueInput('GREEN')
            .setCheck('Number')
            .appendField('red');
        this.appendValueInput('BLUE')
            .setCheck('Number')
            .appendField('green')
            .appendField('blue');
        this.setInputsInline(true);
        this.setOutput(true, 'Color');
        this.setTooltip('Returns a color with the given red, green, and blue components (0-255).');
    }
};

// split color block
Blockly.Blocks['colour_split'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.colors);
        this.appendValueInput('COLOUR')
            .setCheck('Colour')
            .appendField('split color');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list of three elements: red, green, and blue components (0-255).');
    }
};

// blend colors block
Blockly.Blocks['colour_blend'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.colors);
        this.appendValueInput('COLOUR1')
            .setCheck('Colour')
            .appendField('blend');
        this.appendValueInput('COLOUR2')
            .setCheck('Colour')
            .appendField('color1');
        this.appendValueInput('RATIO')
            .setCheck('Number')
            .appendField('color2')
            .appendField('ratio');
        this.setInputsInline(true);
        this.setOutput(true, 'Colour');
        this.setTooltip('Blends two colors together with the given ratio (0.0 to 1.0).');
    }
};

// ============================================================================
// COMPONENT BLOCKS (Dynamic)
// ============================================================================

/**
 * Component Event Block
 * Format: when [ComponentName].[EventName] do
 */
Blockly.Blocks['component_event'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.events);
        this.typeName = 'Button';
        this.eventName = 'Click';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'event_name': this.eventName,
            'instance_name': this.instanceName,
            'is_generic': this.isGeneric
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.eventName = state['event_name'];
        this.instanceName = state['instance_name'];
        this.isGeneric = state['is_generic'];
        this.updateShape_();
    },

    updateShape_: function () {
        if (this.isUpdating) return;
        this.isUpdating = true;
        try {
            // Clear previous inputs safely
            const toRemove = [];
            for (let i = 0; i < this.inputList.length; i++) {
                if (this.inputList[i].name !== 'DO') {
                    toRemove.push(this.inputList[i].name);
                }
            }
            toRemove.forEach(name => this.removeInput(name));

            // Add header
            const header = this.appendDummyInput('HEADER');
            header.appendField('when');
            if (this.isGeneric) {
                header.appendField('any ' + this.typeName);
            } else {
                const instanceDropdown = new Blockly.FieldDropdown(function() {
                    return getComponentInstances(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
                }, (newValue) => {
                    this.instanceName = newValue;
                });
                header.appendField(instanceDropdown, 'INSTANCE');
                if (this.instanceName) {
                    instanceDropdown.setValue(this.instanceName);
                }
            }
            header.appendField('.' + this.eventName);

            // Add parameters (as flydown fields or labels)
            const componentDef = COMPONENT_DATABASE[this.typeName];
            const eventDef = componentDef?.events.find(e => e.name === this.eventName);

            if (eventDef && eventDef.parameters && eventDef.parameters.length > 0) {
                const paramInput = this.appendDummyInput('PARAMS');
                eventDef.parameters.forEach(param => {
                    paramInput.appendField(param.name).appendField(' ');
                });
            }

            // Re-order DO input if it exists, otherwise add it
            if (!this.getInput('DO')) {
                this.appendStatementInput('DO').appendField('do');
            } else {
                this.moveInputBefore('DO', null);
            }
        } finally {
            this.isUpdating = false;
        }
    }
};

/**
 * Component Method Block
 * Format: call [ComponentName].[MethodName]
 */
Blockly.Blocks['component_method'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Notifier';
        this.methodName = 'ShowAlert';
        this.instanceName = 'Notifier1';
        this.isGeneric = false;

        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'method_name': this.methodName,
            'instance_name': this.instanceName,
            'is_generic': this.isGeneric
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.methodName = state['method_name'];
        this.instanceName = state['instance_name'];
        this.isGeneric = state['is_generic'];
        this.updateShape_();
    },

    updateShape_: function () {
        if (this.isUpdating) return;
        this.isUpdating = true;
        try {
            // Remove old inputs
            while (this.inputList.length > 0) {
                this.removeInput(this.inputList[0].name);
            }

            // Header
            const header = this.appendDummyInput('HEADER');
            header.appendField('call');
            if (this.isGeneric) {
                header.appendField('any ' + this.typeName);
            } else {
                header.appendField(' ');
                const instanceDropdown = new Blockly.FieldDropdown(function() {
                    return getComponentInstances(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
                }, (newValue) => {
                    this.instanceName = newValue;
                });
                header.appendField(instanceDropdown, 'INSTANCE');
                if (this.instanceName) {
                    instanceDropdown.setValue(this.instanceName);
                }
            }
            header.appendField('.' + this.methodName);

            // Arguments
            const componentDef = COMPONENT_DATABASE[this.typeName];
            const methodDef = componentDef?.methods.find(m => m.name === this.methodName);

            if (methodDef && methodDef.parameters) {
                methodDef.parameters.forEach(param => {
                    this.appendValueInput('ARG_' + param.name)
                        .setCheck(param.type)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(param.name);
                });
            }
        } finally {
            this.isUpdating = false;
        }
    }
};

/**
 * Component Property Getter Block
 * Format: [ComponentName].[PropertyName]
 */
Blockly.Blocks['component_get_property'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'property_name': this.propertyName,
            'instance_name': this.instanceName,
            'is_generic': this.isGeneric
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.propertyName = state['property_name'];
        this.instanceName = state['instance_name'];
        this.isGeneric = state['is_generic'];
        this.updateShape_();
    },

    updateShape_: function () {
        if (this.isUpdating) return;
        this.isUpdating = true;
        try {
            while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);
            const input = this.appendDummyInput('MAIN');
            if (this.isGeneric) {
                input.appendField('any ' + this.typeName);
            } else {
                const instanceDropdown = new Blockly.FieldDropdown(function() {
                    return getComponentInstances(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
                }, (newValue) => {
                    this.instanceName = newValue;
                });
                input.appendField(instanceDropdown, 'INSTANCE');
                if (this.instanceName) {
                    instanceDropdown.setValue(this.instanceName);
                }
            }

            const propertyDropdown = new Blockly.FieldDropdown(function() {
                return getComponentProperties(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
            }, (newValue) => {
                if (this.propertyName !== newValue) {
                    this.propertyName = newValue;
                    this.updateShape_();
                }
            });
            input.appendField('.');
            input.appendField(propertyDropdown, 'PROPERTY');
            if (this.propertyName) {
                propertyDropdown.setValue(this.propertyName);
            }

            // Set output type based on property
            const componentDef = COMPONENT_DATABASE[this.typeName];
            const propDef = componentDef?.properties.find(p => p.name === this.propertyName);
            if (propDef) {
                this.setOutput(true, propDef.type);
            }
        } finally {
            this.isUpdating = false;
        }
    }
};

/**
 * Component Property Setter Block
 * Format: set [ComponentName].[PropertyName] to
 */
Blockly.Blocks['component_set_property'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'property_name': this.propertyName,
            'instance_name': this.instanceName,
            'is_generic': this.isGeneric
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.propertyName = state['property_name'];
        this.instanceName = state['instance_name'];
        this.isGeneric = state['is_generic'];
        this.updateShape_();
    },

    updateShape_: function () {
        if (this.isUpdating) return;
        this.isUpdating = true;
        try {
            if (this.inputList.length > 0) this.removeInput('VALUE');
            const input = this.appendValueInput('VALUE').appendField('set ');
            if (this.isGeneric) {
                input.appendField('any ' + this.typeName);
            } else {
                const instanceDropdown = new Blockly.FieldDropdown(function() {
                    return getComponentInstances(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
                }, (newValue) => {
                    this.instanceName = newValue;
                });
                input.appendField(instanceDropdown, 'INSTANCE');
                if (this.instanceName) {
                    instanceDropdown.setValue(this.instanceName);
                }
            }

            const propertyDropdown = new Blockly.FieldDropdown(function() {
                return getComponentProperties(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
            }, (newValue) => {
                if (this.propertyName !== newValue) {
                    this.propertyName = newValue;
                    this.updateShape_();
                }
            });
            input.appendField('.');
            input.appendField(propertyDropdown, 'PROPERTY');
            if (this.propertyName) {
                propertyDropdown.setValue(this.propertyName);
            }
            input.appendField(' to');

            // Set check type based on property
            const componentDef = COMPONENT_DATABASE[this.typeName];
            const propDef = componentDef?.properties.find(p => p.name === this.propertyName);
            if (propDef) {
                input.setCheck(propDef.type);
            }
        } finally {
            this.isUpdating = false;
        }
    }
};

/**
 * Component Selector Block (for generic blocks)
 * Format: [ComponentName]
 */
Blockly.Blocks['component_component_block'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.getters);
        this.typeName = 'Button';
        this.instanceName = 'Button1';
        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'instance_name': this.instanceName
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.instanceName = state['instance_name'];
        this.updateShape_();
    },

    updateShape_: function () {
        if (this.isUpdating) return;
        this.isUpdating = true;
        try {
            while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);
            const input = this.appendDummyInput('MAIN');
            
            const instanceDropdown = new Blockly.FieldDropdown(function() {
                return getComponentInstances(this.getSourceBlock()?.typeName || 'Button', this.getValue(), this.getSourceBlock());
            }, (newValue) => {
                this.instanceName = newValue;
            });
            
            input.appendField(instanceDropdown, 'INSTANCE');
            if (this.instanceName) {
                instanceDropdown.setValue(this.instanceName);
            }
            this.setOutput(true, 'Component');
        } finally {
            this.isUpdating = false;
        }
    }
};

/**
 * Generic Component Event Block (Any Component)
 */
Blockly.Blocks['any_component_event'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.events);
        this.typeName = 'Button';
        this.eventName = 'Click';
        this.isGeneric = true;
        this.updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_event'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_event'].loadExtraState,
    updateShape_: Blockly.Blocks['component_event'].updateShape_
};

/**
 * Generic Component Method Block (Any Component)
 */
Blockly.Blocks['any_component_method'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Notifier';
        this.methodName = 'ShowAlert';
        this.isGeneric = true;
        this.updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_method'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_method'].loadExtraState,
    updateShape_: function () {
        Blockly.Blocks['component_method'].updateShape_.call(this);
        // Special case for generic method: add a 'component' input if not present
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
    }
};

/**
 * Generic Component Property Getter Block (Any Component)
 */
Blockly.Blocks['any_component_get_property'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.isGeneric = true;
        this.updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_get_property'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_get_property'].loadExtraState,
    updateShape_: function () {
        Blockly.Blocks['component_get_property'].updateShape_.call(this);
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
    }
};

/**
 * Generic Component Property Setter Block (Any Component)
 */
Blockly.Blocks['any_component_set_property'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.isGeneric = true;
        this.updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_set_property'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_set_property'].loadExtraState,
    updateShape_: function () {
        Blockly.Blocks['component_set_property'].updateShape_.call(this);
        // Move the 'to' value input after the 'for component' input
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
        this.moveInputBefore('VALUE', null);
    }
};

/**
 * Component Property Choice Block (Dropdowns)
 * Provides preset values for properties like Alignment, Orientation, etc.
 */
Blockly.Blocks['component_choice'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        this.typeName = 'Screen';
        this.propertyName = 'ScreenOrientation';
        this.choiceValue = 'Portrait';
        this.updateShape_();
    },

    saveExtraState: function () {
        return {
            'component_type': this.typeName,
            'property_name': this.propertyName,
            'choice_value': this.choiceValue
        };
    },

    loadExtraState: function (state) {
        this.typeName = state['component_type'];
        this.propertyName = state['property_name'];
        this.choiceValue = state['choice_value'];
        this.updateShape_();
    },

    updateShape_: function () {
        while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);

        const componentDef = COMPONENT_DATABASE[this.typeName];
        const propDef = componentDef?.properties.find(p => p.name === this.propertyName);
        const options = propDef?.options || ['No Options'];

        const dropdown = new Blockly.FieldDropdown(options.map(opt => [opt, opt]), (newValue) => {
            this.choiceValue = newValue;
        });

        this.appendDummyInput('MAIN')
            .appendField(dropdown, 'CHOICE');

        this.getField('CHOICE').setValue(this.choiceValue);
        this.setOutput(true, propDef?.type || null);
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create component blocks dynamically based on app state
 */
export function createComponentBlocks(appState) {
    const blocks = [];

    // Get current screen
    const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
    if (!currentScreen) return blocks;

    // Flatten component tree
    const flattenVisible = (list = []) =>
        list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);

    const components = [
        ...flattenVisible(currentScreen.components || []),
        ...(currentScreen.nonVisibleComponents || [])
    ];

    // Create blocks for each component
    components.forEach(comp => {
        const componentDef = COMPONENT_DATABASE[comp.type];
        if (!componentDef) return;

        // Event blocks
        componentDef.events.forEach(event => {
            blocks.push({
                kind: 'block',
                type: 'component_event',
                extraState: {
                    component_type: comp.type,
                    instance_name: comp.id,
                    event_name: event.name,
                    is_generic: false
                }
            });
        });

        // Method blocks
        componentDef.methods.forEach(method => {
            blocks.push({
                kind: 'block',
                type: 'component_method',
                extraState: {
                    component_type: comp.type,
                    instance_name: comp.id,
                    method_name: method.name,
                    is_generic: false
                }
            });
        });

        // Property blocks
        componentDef.properties.forEach(prop => {
            // Getter
            blocks.push({
                kind: 'block',
                type: 'component_get_property',
                extraState: {
                    component_type: comp.type,
                    instance_name: comp.id,
                    property_name: prop.name,
                    is_generic: false
                }
            });

            // Setter
            blocks.push({
                kind: 'block',
                type: 'component_set_property',
                extraState: {
                    component_type: comp.type,
                    instance_name: comp.id,
                    property_name: prop.name,
                    is_generic: false
                }
            });

            // Choice block (if options exist)
            if (prop.options) {
                blocks.push({
                    kind: 'block',
                    type: 'component_choice',
                    extraState: {
                        component_type: comp.type,
                        property_name: prop.name,
                        choice_value: prop.options[0]
                    }
                });
            }
        });
    });

    return blocks;
}
