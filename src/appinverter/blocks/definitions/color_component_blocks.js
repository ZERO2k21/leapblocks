/**
 * MIT App Inventor Color and Component Blocks
 */
import * as Blockly from 'blockly';
import { FieldColour } from '@blockly/field-colour';
import { MIT_COLORS } from './builtin_blocks';
import { COMPONENT_METADATA as COMPONENT_DATABASE } from '../data/componentMetadata';

// ============================================================================
// COLOR BLOCKS
// ============================================================================

// color picker block
Blockly.Blocks['colour_picker'] = {
    init: function () {
        this.setColour(MIT_COLORS.colors);
        this.appendDummyInput()
            .appendField(new FieldColour('#ff0000'), 'COLOUR');
        this.setOutput(true, 'Colour');
        this.setTooltip('Click to select a color.');
    }
};

// random color block
Blockly.Blocks['colour_random'] = {
    init: function () {
        this.setColour(MIT_COLORS.colors);
        this.appendDummyInput()
            .appendField('random color');
        this.setOutput(true, 'Colour');
        this.setTooltip('Returns a random color.');
    }
};

// make color (RGB) block
Blockly.Blocks['colour_rgb'] = {
    init: function () {
        this.setColour(MIT_COLORS.colors);
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
        this.setOutput(true, 'Colour');
        this.setTooltip('Returns a color with the given red, green, and blue components (0-255).');
    }
};

// split color block
Blockly.Blocks['colour_split'] = {
    init: function () {
        this.setColour(MIT_COLORS.colors);
        this.appendValueInput('COLOUR')
            .setCheck('Colour')
            .appendField('split color');
        this.setOutput(true, 'Array');
        this.setTooltip('Returns a list of three elements: red, green, and blue components (0-255).');
    }
};

// blend colors block
Blockly.Blocks['colour_blend'] = {
    init: function () {
        this.setColour(MIT_COLORS.colors);
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
        this.setColour(MIT_COLORS.events);
        this.typeName = 'Button';
        this.eventName = 'Click';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    mutationToDom: function () {
        const container = document.createElement('mutation');
        container.setAttribute('component_type', this.typeName);
        container.setAttribute('event_name', this.eventName);
        container.setAttribute('instance_name', this.instanceName);
        container.setAttribute('is_generic', this.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (xmlElement) {
        this.typeName = xmlElement.getAttribute('component_type');
        this.eventName = xmlElement.getAttribute('event_name');
        this.instanceName = xmlElement.getAttribute('instance_name');
        this.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
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
        // Clear previous inputs
        const inputs = this.inputList.slice();
        inputs.forEach(input => {
            if (input.name !== 'DO') {
                this.removeInput(input.name);
            }
        });

        // Add header
        const header = this.appendDummyInput('HEADER');
        header.appendField('when');
        if (this.isGeneric) {
            header.appendField('any ' + this.typeName);
        } else {
            header.appendField(this.instanceName);
        }
        header.appendField('.' + this.eventName);

        // Add parameters (as flydown fields or labels)
        const componentDef = COMPONENT_DATABASE[this.typeName];
        const eventDef = componentDef?.events.find(e => e.name === this.eventName);

        if (eventDef && eventDef.parameters.length > 0) {
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
    }
};

/**
 * Component Method Block
 * Format: call [ComponentName].[MethodName]
 */
Blockly.Blocks['component_method'] = {
    init: function () {
        this.setColour(MIT_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Notifier';
        this.methodName = 'ShowAlert';
        this.instanceName = 'Notifier1';
        this.isGeneric = false;

        this.updateShape_();
    },

    mutationToDom: function () {
        const container = document.createElement('mutation');
        container.setAttribute('component_type', this.typeName);
        container.setAttribute('method_name', this.methodName);
        container.setAttribute('instance_name', this.instanceName);
        container.setAttribute('is_generic', this.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (xmlElement) {
        this.typeName = xmlElement.getAttribute('component_type');
        this.methodName = xmlElement.getAttribute('method_name');
        this.instanceName = xmlElement.getAttribute('instance_name');
        this.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
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
            header.appendField(this.instanceName);
        }
        header.appendField('.' + this.methodName);

        // Arguments
        const componentDef = COMPONENT_DATABASE[this.typeName];
        const methodDef = componentDef?.methods.find(m => m.name === this.methodName);

        if (methodDef) {
            methodDef.parameters.forEach(param => {
                this.appendValueInput('ARG_' + param.name)
                    .setCheck(param.type)
                    .setAlign(Blockly.inputs.Align.RIGHT)
                    .appendField(param.name);
            });
        }
    }
};

/**
 * Component Property Getter Block
 * Format: [ComponentName].[PropertyName]
 */
Blockly.Blocks['component_get_property'] = {
    init: function () {
        this.setColour(MIT_COLORS.getters);
        this.setOutput(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    mutationToDom: function () {
        const container = document.createElement('mutation');
        container.setAttribute('component_type', this.typeName);
        container.setAttribute('property_name', this.propertyName);
        container.setAttribute('instance_name', this.instanceName);
        container.setAttribute('is_generic', this.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (xmlElement) {
        this.typeName = xmlElement.getAttribute('component_type');
        this.propertyName = xmlElement.getAttribute('property_name');
        this.instanceName = xmlElement.getAttribute('instance_name');
        this.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
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
        if (this.inputList.length > 0) this.removeInput('MAIN');
        const input = this.appendDummyInput('MAIN');
        if (this.isGeneric) {
            input.appendField('any ' + this.typeName);
        } else {
            input.appendField(this.instanceName);
        }
        input.appendField('.' + this.propertyName);

        // Set output type based on property
        const componentDef = COMPONENT_DATABASE[this.typeName];
        const propDef = componentDef?.properties.find(p => p.name === this.propertyName);
        if (propDef) {
            this.setOutput(true, propDef.type);
        }
    }
};

/**
 * Component Property Setter Block
 * Format: set [ComponentName].[PropertyName] to
 */
Blockly.Blocks['component_set_property'] = {
    init: function () {
        this.setColour(MIT_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.instanceName = 'Button1';
        this.isGeneric = false;

        this.updateShape_();
    },

    mutationToDom: function () {
        const container = document.createElement('mutation');
        container.setAttribute('component_type', this.typeName);
        container.setAttribute('property_name', this.propertyName);
        container.setAttribute('instance_name', this.instanceName);
        container.setAttribute('is_generic', this.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (xmlElement) {
        this.typeName = xmlElement.getAttribute('component_type');
        this.propertyName = xmlElement.getAttribute('property_name');
        this.instanceName = xmlElement.getAttribute('instance_name');
        this.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
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
        if (this.inputList.length > 0) this.removeInput('VALUE');
        const input = this.appendValueInput('VALUE').appendField('set ');
        if (this.isGeneric) {
            input.appendField('any ' + this.typeName);
        } else {
            input.appendField(this.instanceName);
        }
        input.appendField('.' + this.propertyName).appendField(' to');

        // Set check type based on property
        const componentDef = COMPONENT_DATABASE[this.typeName];
        const propDef = componentDef?.properties.find(p => p.name === this.propertyName);
        if (propDef) {
            input.setCheck(propDef.type);
        }
    }
};

/**
 * Component Selector Block (for generic blocks)
 * Format: [ComponentName]
 */
Blockly.Blocks['component_component_block'] = {
    init: function () {
        this.setColour(MIT_COLORS.getters);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['Component1', 'Component1']]), 'COMPONENT_SELECTOR');
        this.setOutput(true, 'Component');
        this.setTooltip('Refers to a component.');
        this.componentName = '';
    },

    updateComponentDropdown: function (components) {
        const dropdown = this.getField('COMPONENT_SELECTOR');
        if (dropdown) {
            const options = components.map(c => [c.id, c.id]);
            dropdown.menuGenerator_ = options;
        }
    }
};

/**
 * Generic Component Event Block (Any Component)
 */
Blockly.Blocks['any_component_event'] = {
    init: function () {
        this.setColour(MIT_COLORS.events);
        this.typeName = 'Button';
        this.eventName = 'Click';
        this.isGeneric = true;
        this.updateShape_();
    },
    mutationToDom: Blockly.Blocks['component_event'].mutationToDom,
    domToMutation: Blockly.Blocks['component_event'].domToMutation,
    updateShape_: Blockly.Blocks['component_event'].updateShape_
};

/**
 * Generic Component Method Block (Any Component)
 */
Blockly.Blocks['any_component_method'] = {
    init: function () {
        this.setColour(MIT_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Notifier';
        this.methodName = 'ShowAlert';
        this.isGeneric = true;
        this.updateShape_();
    },
    mutationToDom: Blockly.Blocks['component_method'].mutationToDom,
    domToMutation: Blockly.Blocks['component_method'].domToMutation,
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
        this.setColour(MIT_COLORS.getters);
        this.setOutput(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.isGeneric = true;
        this.updateShape_();
    },
    mutationToDom: Blockly.Blocks['component_get_property'].mutationToDom,
    domToMutation: Blockly.Blocks['component_get_property'].domToMutation,
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
        this.setColour(MIT_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.typeName = 'Button';
        this.propertyName = 'Text';
        this.isGeneric = true;
        this.updateShape_();
    },
    mutationToDom: Blockly.Blocks['component_set_property'].mutationToDom,
    domToMutation: Blockly.Blocks['component_set_property'].domToMutation,
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
        });
    });

    return blocks;
}
