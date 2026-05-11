/**
 * MIT App Inventor Color and Component Blocks
 */
import * as Blockly from 'blockly';
import { FieldColour } from '@blockly/field-colour';
import { MIT_COLORS } from './builtin_blocks';

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
        this.appendDummyInput()
            .appendField('when')
            .appendField(new Blockly.FieldDropdown([['Component1', 'Component1']]), 'COMPONENT')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Event', 'Event']]), 'EVENT');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setTooltip('Runs when the specified event occurs.');
        this.componentName = '';
        this.eventName = '';
    },

    /**
     * Update the dropdown options based on available components
     */
    updateComponentDropdown: function (components) {
        const dropdown = this.getField('COMPONENT');
        if (dropdown) {
            const options = components.map(c => [c.id, c.id]);
            dropdown.menuGenerator_ = options;
        }
    },

    /**
     * Update the event dropdown based on selected component
     */
    updateEventDropdown: function (events) {
        const dropdown = this.getField('EVENT');
        if (dropdown) {
            const options = events.map(e => [e.name, e.name]);
            dropdown.menuGenerator_ = options;
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
        this.appendDummyInput()
            .appendField('call')
            .appendField(new Blockly.FieldDropdown([['Component1', 'Component1']]), 'COMPONENT')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Method', 'Method']]), 'METHOD');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Calls a method on the component.');
        this.componentName = '';
        this.methodName = '';
    },

    updateComponentDropdown: function (components) {
        const dropdown = this.getField('COMPONENT');
        if (dropdown) {
            const options = components.map(c => [c.id, c.id]);
            dropdown.menuGenerator_ = options;
        }
    },

    updateMethodDropdown: function (methods) {
        const dropdown = this.getField('METHOD');
        if (dropdown) {
            const options = methods.map(m => [m.name, m.name]);
            dropdown.menuGenerator_ = options;
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
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['Component1', 'Component1']]), 'COMPONENT')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Property', 'Property']]), 'PROPERTY');
        this.setOutput(true);
        this.setTooltip('Gets the value of a component property.');
        this.componentName = '';
        this.propertyName = '';
    },

    updateComponentDropdown: function (components) {
        const dropdown = this.getField('COMPONENT');
        if (dropdown) {
            const options = components.map(c => [c.id, c.id]);
            dropdown.menuGenerator_ = options;
        }
    },

    updatePropertyDropdown: function (properties) {
        const dropdown = this.getField('PROPERTY');
        if (dropdown) {
            const options = properties.map(p => [p.name, p.name]);
            dropdown.menuGenerator_ = options;
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
        this.appendValueInput('VALUE')
            .appendField('set')
            .appendField(new Blockly.FieldDropdown([['Component1', 'Component1']]), 'COMPONENT')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Property', 'Property']]), 'PROPERTY')
            .appendField('to');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Sets the value of a component property.');
        this.componentName = '';
        this.propertyName = '';
    },

    updateComponentDropdown: function (components) {
        const dropdown = this.getField('COMPONENT');
        if (dropdown) {
            const options = components.map(c => [c.id, c.id]);
            dropdown.menuGenerator_ = options;
        }
    },

    updatePropertyDropdown: function (properties) {
        const dropdown = this.getField('PROPERTY');
        if (dropdown) {
            const options = properties.map(p => [p.name, p.name]);
            dropdown.menuGenerator_ = options;
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
 * Format: when any [ComponentType].[EventName] do
 */
Blockly.Blocks['any_component_event'] = {
    init: function () {
        this.setColour(MIT_COLORS.events);
        this.appendDummyInput()
            .appendField('when any')
            .appendField(new Blockly.FieldDropdown([['Button', 'Button']]), 'COMPONENT_TYPE')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Click', 'Click']]), 'EVENT');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setTooltip('Runs when the specified event occurs on any component of this type.');
    }
};

/**
 * Generic Component Method Block (Any Component)
 * Format: call [ComponentType].[MethodName] for component [ComponentInstance]
 */
Blockly.Blocks['any_component_method'] = {
    init: function () {
        this.setColour(MIT_COLORS.methods);
        this.appendDummyInput()
            .appendField('call')
            .appendField(new Blockly.FieldDropdown([['Button', 'Button']]), 'COMPONENT_TYPE')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['HideKeyboard', 'HideKeyboard']]), 'METHOD');
        this.appendValueInput('COMPONENT')
            .setCheck('Component')
            .appendField('for component');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Calls a method on a specific component of this type.');
    }
};

/**
 * Generic Component Property Getter Block (Any Component)
 * Format: get [ComponentType].[PropertyName] for component [ComponentInstance]
 */
Blockly.Blocks['any_component_get_property'] = {
    init: function () {
        this.setColour(MIT_COLORS.getters);
        this.appendDummyInput()
            .appendField('get')
            .appendField(new Blockly.FieldDropdown([['Button', 'Button']]), 'COMPONENT_TYPE')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Text', 'Text']]), 'PROPERTY');
        this.appendValueInput('COMPONENT')
            .setCheck('Component')
            .appendField('for component');
        this.setOutput(true);
        this.setTooltip('Gets the value of a property for a specific component of this type.');
    }
};

/**
 * Generic Component Property Setter Block (Any Component)
 * Format: set [ComponentType].[PropertyName] for component [ComponentInstance] to
 */
Blockly.Blocks['any_component_set_property'] = {
    init: function () {
        this.setColour(MIT_COLORS.setters);
        this.appendDummyInput()
            .appendField('set')
            .appendField(new Blockly.FieldDropdown([['Button', 'Button']]), 'COMPONENT_TYPE')
            .appendField('.')
            .appendField(new Blockly.FieldDropdown([['Text', 'Text']]), 'PROPERTY');
        this.appendValueInput('COMPONENT')
            .setCheck('Component')
            .appendField('for component');
        this.appendValueInput('VALUE')
            .appendField('to');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Sets the value of a property for a specific component of this type.');
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
        // Event blocks
        const events = getComponentEvents(comp.type);
        events.forEach(event => {
            blocks.push({
                kind: 'block',
                type: 'component_event',
                fields: {
                    COMPONENT: comp.id,
                    EVENT: event.name
                }
            });
        });

        // Method blocks
        const methods = getComponentMethods(comp.type);
        methods.forEach(method => {
            blocks.push({
                kind: 'block',
                type: 'component_method',
                fields: {
                    COMPONENT: comp.id,
                    METHOD: method.name
                }
            });
        });

        // Property getter/setter blocks
        const properties = getComponentProperties(comp.type);
        properties.forEach(prop => {
            // Getter
            blocks.push({
                kind: 'block',
                type: 'component_get_property',
                fields: {
                    COMPONENT: comp.id,
                    PROPERTY: prop.name
                }
            });

            // Setter
            blocks.push({
                kind: 'block',
                type: 'component_set_property',
                fields: {
                    COMPONENT: comp.id,
                    PROPERTY: prop.name
                }
            });
        });
    });

    return blocks;
}

/**
 * Get events for a component type
 */
function getComponentEvents(componentType) {
    const eventMap = {
        'Button': [
            { name: 'Click' },
            { name: 'LongClick' },
            { name: 'TouchDown' },
            { name: 'TouchUp' },
            { name: 'GotFocus' },
            { name: 'LostFocus' }
        ],
        'Label': [{ name: 'Click' }],
        'TextBox': [
            { name: 'GotFocus' },
            { name: 'LostFocus' },
            { name: 'TextChanged' }
        ],
        'CheckBox': [
            { name: 'Changed' },
            { name: 'GotFocus' },
            { name: 'LostFocus' }
        ],
        'Switch': [{ name: 'Changed' }],
        'Slider': [{ name: 'PositionChanged' }],
        'Image': [{ name: 'Click' }],
        'Canvas': [
            { name: 'Touched' },
            { name: 'Dragged' },
            { name: 'Flung' }
        ],
        'Screen': [
            { name: 'Initialize' },
            { name: 'BackPressed' },
            { name: 'ErrorOccurred' }
        ]
    };

    return eventMap[componentType] || [];
}

/**
 * Get methods for a component type
 */
function getComponentMethods(componentType) {
    const methodMap = {
        'Button': [],
        'Label': [],
        'TextBox': [],
        'Canvas': [
            { name: 'Clear' },
            { name: 'DrawCircle' },
            { name: 'DrawLine' },
            { name: 'DrawPoint' }
        ],
        'Camera': [{ name: 'TakePicture' }],
        'Sound': [
            { name: 'Play' },
            { name: 'Pause' },
            { name: 'Stop' }
        ],
        'TinyDB': [
            { name: 'StoreValue' },
            { name: 'GetValue' },
            { name: 'ClearAll' }
        ],
        'Web': [
            { name: 'Get' },
            { name: 'Post' }
        ],
        'Notifier': [
            { name: 'ShowAlert' },
            { name: 'ShowChooseDialog' }
        ]
    };

    return methodMap[componentType] || [];
}

/**
 * Get properties for a component type
 */
function getComponentProperties(componentType) {
    const propMap = {
        'Button': [
            { name: 'Text' },
            { name: 'BackgroundColor' },
            { name: 'TextColor' },
            { name: 'Enabled' },
            { name: 'FontSize' },
            { name: 'Width' },
            { name: 'Height' },
            { name: 'Visible' }
        ],
        'Label': [
            { name: 'Text' },
            { name: 'TextColor' },
            { name: 'BackgroundColor' },
            { name: 'FontSize' },
            { name: 'Width' },
            { name: 'Height' },
            { name: 'Visible' }
        ],
        'TextBox': [
            { name: 'Text' },
            { name: 'Hint' },
            { name: 'Enabled' },
            { name: 'FontSize' },
            { name: 'Width' },
            { name: 'Height' },
            { name: 'Visible' }
        ],
        'CheckBox': [
            { name: 'Text' },
            { name: 'Checked' },
            { name: 'Enabled' },
            { name: 'Visible' }
        ],
        'Switch': [
            { name: 'Text' },
            { name: 'On' },
            { name: 'Enabled' },
            { name: 'Visible' }
        ],
        'Slider': [
            { name: 'MinValue' },
            { name: 'MaxValue' },
            { name: 'ThumbPosition' },
            { name: 'Visible' }
        ],
        'Image': [
            { name: 'Picture' },
            { name: 'Width' },
            { name: 'Height' },
            { name: 'Visible' }
        ],
        'Canvas': [
            { name: 'BackgroundColor' },
            { name: 'Width' },
            { name: 'Height' },
            { name: 'Visible' }
        ]
    };

    return propMap[componentType] || [];
}
