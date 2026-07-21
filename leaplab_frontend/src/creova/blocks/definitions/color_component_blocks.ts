import * as Blockly from 'blockly';
import { FieldColour } from '@blockly/field-colour';
import { BLOCK_COLORS } from '../utils/blockColors';
import { COMPONENT_METADATA as COMPONENT_DATABASE } from '../../data/componentMetadata';

const getComponentInstances = (typeName: string, currentValue: string | null | undefined, block: any): string[][] => {
    const val = currentValue || block?.instanceName || '';
    const components = (window as any).LeapLab_Components || [];
    const instances = components
        .filter((c: any) => c.type === typeName)
        .map((c: any) => [c.name || c.id, c.id || c.name]);

    if (typeName === 'Screen' && (window as any).LeapLab_ActiveScreen) {
        const screenId = (window as any).LeapLab_ActiveScreen.id || (window as any).LeapLab_ActiveScreen.name;
        if (!instances.some((i: string[]) => i[1] === screenId)) {
            instances.unshift([screenId, screenId]);
        }
    }

    if ((window as any).LeapLab_ActiveScreen) {
        const screenId = (window as any).LeapLab_ActiveScreen.id || (window as any).LeapLab_ActiveScreen.name;
        if (screenId && !instances.some((i: string[]) => i[1] === screenId)) {
            instances.push([screenId, screenId]);
        }
    }

    if (val && !instances.some((i: string[]) => i[1] === val)) {
        instances.push([val, val]);
    }

    if (instances.length === 0) {
        instances.push(['(none)', '']);
    }

    return instances;
};

const getComponentEvents = (typeName: string): string[][] => {
    const metadata = (COMPONENT_DATABASE as any)[typeName];
    if (!metadata || !metadata.events) return [['Event', 'Event']];
    return metadata.events.map((e: any) => [e.name, e.name]);
};

const getComponentMethods = (typeName: string): string[][] => {
    const metadata = (COMPONENT_DATABASE as any)[typeName];
    if (!metadata || !metadata.methods) return [['Method', 'Method']];
    return metadata.methods.map((m: any) => [m.name, m.name]);
};

const getComponentProperties = (typeName: string, currentValue: string | null | undefined, block: any): string[][] => {
    const val = currentValue || block?.propertyName;
    const metadata = (COMPONENT_DATABASE as any)[typeName];
    if (!metadata || !metadata.properties) return [[val || '(none)', val || '']];
    const options = metadata.properties.map((p: any) => [p.name, p.name]);

    if (val && !options.some((i: string[]) => i[1] === val)) {
        options.push([val, val]);
    }
    if (options.length === 0) {
        options.push(['(none)', '']);
    }
    return options;
};

const hasOption = (options: string[][], value: string): boolean => options.some((opt) => opt[1] === value);

const createInstanceDropdown = (block: Blockly.Block, initialOptions: string[][], onChangeCallback: (newValue: string) => void): Blockly.FieldDropdown => {
    const dropdown = new Blockly.FieldDropdown(initialOptions, onChangeCallback);
    (dropdown as any).doClassValidation_ = function (newValue: any) {
        if (newValue === null || newValue === undefined) return null;
        return String(newValue);
    };
    return dropdown;
};

Blockly.Blocks['colour_picker'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.colors);
        this.appendDummyInput()
            .appendField(new FieldColour('#ff0000'), 'COLOUR');
        this.setOutput(true, 'Color');
        this.setTooltip('Click to select a color.');
    }
};

Blockly.Blocks['colour_random'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.colors);
        this.appendDummyInput()
            .appendField('random color');
        this.setOutput(true, 'Color');
        this.setTooltip('Returns a random color.');
    }
};

Blockly.Blocks['colour_rgb'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['colour_split'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.colors);
        this.appendValueInput('COLOUR')
            .setCheck('Colour')
            .appendField('split color');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list of three elements: red, green, and blue components (0-255).');
    }
};

Blockly.Blocks['colour_blend'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['component_event'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.events);
        (this as any).typeName = 'Button';
        (this as any).eventName = 'Click';
        (this as any).instanceName = 'Button1';
        (this as any).isGeneric = false;

        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'event_name': self.eventName,
            'instance_name': self.instanceName,
            'is_generic': self.isGeneric
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        console.log(`[BLOCK DEBUG] loadExtraState called for ${self.type} state=`, JSON.stringify(state));
        console.trace(`[BLOCK DEBUG] loadExtraState stack trace`);
        self.typeName = state['component_type'];
        self.eventName = state['event_name'];
        self.instanceName = state['instance_name'];
        self.isGeneric = state['is_generic'];
        console.log(`[BLOCK DEBUG] loadExtraState about to call updateShape_, isUpdating=${self.isUpdating}`);
        self.updateShape_();
        console.log(`[BLOCK DEBUG] loadExtraState after updateShape_`);
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('event_name', self.eventName || '');
        container.setAttribute('instance_name', self.instanceName || '');
        container.setAttribute('is_generic', self.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Button';
        self.eventName = xmlElement.getAttribute('event_name') || 'Click';
        self.instanceName = xmlElement.getAttribute('instance_name') || 'Button1';
        self.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.isUpdating) return;
        self.isUpdating = true;
        try {
            console.log(`[BLOCK DEBUG] updateShape_ for ${self.type || '?'} typeName=${self.typeName} instanceName=${self.instanceName} eventName=${self.eventName} isGeneric=${self.isGeneric}`);

            const toRemove = [];
            for (let i = 0; i < this.inputList.length; i++) {
                if (this.inputList[i].name !== 'DO') {
                    toRemove.push(this.inputList[i].name);
                }
            }
            toRemove.forEach((name: string) => this.removeInput(name));

            const header = this.appendDummyInput('HEADER');
            header.appendField('when');
            if (self.isGeneric) {
                header.appendField('any ' + self.typeName);
            } else {
                const initialOptions = getComponentInstances(self.typeName, self.instanceName, self);
                console.log(`[BLOCK DEBUG] initialOptions for ${self.typeName}:`, JSON.stringify(initialOptions));
                const instanceDropdown = createInstanceDropdown(this, initialOptions, (newValue: string) => {
                    self.instanceName = newValue;
                });
                instanceDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                    const block = (this as any).getSourceBlock();
                    return getComponentInstances(block?.typeName || 'Button', block?.instanceName, block);
                };
                header.appendField(instanceDropdown, 'INSTANCE');
                instanceDropdown.setValue(self.instanceName);
                console.log(`[BLOCK DEBUG] After setValue, fieldValue=`, instanceDropdown.getValue());
            }
            header.appendField('.' + self.eventName);

            const componentDef = (COMPONENT_DATABASE as any)[self.typeName];
            const eventDef = componentDef?.events.find((e: any) => e.name === self.eventName);

            if (eventDef && eventDef.parameters && eventDef.parameters.length > 0) {
                const paramInput = this.appendDummyInput('PARAMS');
                eventDef.parameters.forEach((param: any) => {
                    paramInput.appendField(param.name).appendField(' ');
                });
            }

            if (!this.getInput('DO')) {
                this.appendStatementInput('DO').appendField('do');
            } else {
                this.moveInputBefore('DO', null);
            }
        } finally {
            self.isUpdating = false;
        }
    }
};

Blockly.Blocks['component_method'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        (this as any).typeName = 'Notifier';
        (this as any).methodName = 'ShowAlert';
        (this as any).instanceName = 'Notifier1';
        (this as any).isGeneric = false;

        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'method_name': self.methodName,
            'instance_name': self.instanceName,
            'is_generic': self.isGeneric
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        console.log(`[BLOCK DEBUG] loadExtraState for ${self.type} state=${JSON.stringify(state)}`);
        self.typeName = state['component_type'];
        self.methodName = state['method_name'];
        self.instanceName = state['instance_name'];
        self.isGeneric = state['is_generic'];
        self.updateShape_();
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('method_name', self.methodName || '');
        container.setAttribute('instance_name', self.instanceName || '');
        container.setAttribute('is_generic', self.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Notifier';
        self.methodName = xmlElement.getAttribute('method_name') || 'ShowAlert';
        self.instanceName = xmlElement.getAttribute('instance_name') || 'Notifier1';
        self.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.isUpdating) return;
        self.isUpdating = true;
        try {
            console.log(`[BLOCK DEBUG] updateShape_ for ${self.type || '?'} typeName=${self.typeName} instanceName=${self.instanceName} methodName=${self.methodName} isGeneric=${self.isGeneric}`);

            while (this.inputList.length > 0) {
                this.removeInput(this.inputList[0].name);
            }

            const header = this.appendDummyInput('HEADER');
            header.appendField('call');
            if (self.isGeneric) {
                header.appendField('any ' + self.typeName);
            } else {
                const initialOptions = getComponentInstances(self.typeName, self.instanceName, self);
                console.log(`[BLOCK DEBUG] initialOptions for ${self.typeName}:`, JSON.stringify(initialOptions));
                const instanceDropdown = createInstanceDropdown(this, initialOptions, (newValue: string) => {
                    self.instanceName = newValue;
                });
                instanceDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                    const block = (this as any).getSourceBlock();
                    return getComponentInstances(block?.typeName || 'Notifier', block?.instanceName, block);
                };
                header.appendField(instanceDropdown, 'INSTANCE');
                instanceDropdown.setValue(self.instanceName);
                console.log(`[BLOCK DEBUG] After setValue, fieldValue=`, instanceDropdown.getValue());
            }
            header.appendField('.' + self.methodName);

            const componentDef = (COMPONENT_DATABASE as any)[self.typeName];
            const methodDef = componentDef?.methods.find((m: any) => m.name === self.methodName);

            if (methodDef && methodDef.parameters) {
                methodDef.parameters.forEach((param: any) => {
                    this.appendValueInput('ARG_' + param.name)
                        .setCheck(param.type)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(param.name);
                });
            }

            let hasReturn = false;
            let returnType: string | null = null;

            if (methodDef && methodDef.returns !== undefined) {
                hasReturn = methodDef.returns && methodDef.returns !== 'Void';
                returnType = methodDef.returns === 'Any' ? null : methodDef.returns;
            } else {
                const methodName = self.methodName;
                if (methodName.match(/^(GetValue|GetTags|IsConnected|IsDevicePaired|HasAccuracy|ReceiveSigned|ReceiveUnsigned|ReceiveText|BytesAvailable|Calculate|Check|Accept|Format|Split|Replace|Connect|JsonTextDecode|JsonTextDecodeWithDictionaries|UriEncode|HtmlTextDecode|UriDecode|XMLTextDecode)/i)) {
                    hasReturn = true;
                    if (methodName.match(/^(Is|Has|Check|Accept|Connect)/i)) returnType = 'Boolean';
                    else if (methodName.match(/^(ReceiveSignedBytes|ReceiveUnsignedBytes)/i)) returnType = 'List';
                    else if (methodName.match(/^(ReceiveSigned|ReceiveUnsigned|BytesAvailable|Length)/i)) returnType = 'Number';
                    else if (methodName.match(/^(ReceiveText|Format|Replace|Trim|UriEncode|UriDecode)/i)) returnType = 'String';
                    else if (methodName.match(/^(GetTags|Split)/i)) returnType = 'List';
                }

                if (methodName.match(/^(Send|Disconnect|Show|Hide|Clear|Add|Remove|Delete|Set|Play|Stop|Pause|Vibrate|Save|Write|Move|Get$|Post|Put|Patch)/i)) {
                    hasReturn = false;
                }
            }

            if (hasReturn) {
                this.setPreviousStatement(false);
                this.setNextStatement(false);
                this.setOutput(true, returnType);
            } else {
                this.setOutput(false);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
            }

        } finally {
            self.isUpdating = false;
        }
    }
};

Blockly.Blocks['component_get_property'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        (this as any).typeName = 'Button';
        (this as any).propertyName = 'Text';
        (this as any).instanceName = 'Button1';
        (this as any).isGeneric = false;

        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'property_name': self.propertyName,
            'instance_name': self.instanceName,
            'is_generic': self.isGeneric
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        console.log(`[BLOCK DEBUG] loadExtraState for ${self.type} state=${JSON.stringify(state)}`);
        self.typeName = state['component_type'];
        self.propertyName = state['property_name'];
        self.instanceName = state['instance_name'];
        self.isGeneric = state['is_generic'];
        self.updateShape_();
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('property_name', self.propertyName || '');
        container.setAttribute('instance_name', self.instanceName || '');
        container.setAttribute('is_generic', self.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Button';
        self.propertyName = xmlElement.getAttribute('property_name') || 'Text';
        self.instanceName = xmlElement.getAttribute('instance_name') || 'Button1';
        self.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.isUpdating) return;
        self.isUpdating = true;
        try {
            console.log(`[BLOCK DEBUG] updateShape_ for ${self.type || '?'} typeName=${self.typeName} instanceName=${self.instanceName} propertyName=${self.propertyName} isGeneric=${self.isGeneric}`);

            while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);
            const input = this.appendDummyInput('MAIN');
            if (self.isGeneric) {
                input.appendField('any ' + self.typeName);
            } else {
                const initialOptions = getComponentInstances(self.typeName, self.instanceName, self);
                console.log(`[BLOCK DEBUG] initialOptions for ${self.typeName}:`, JSON.stringify(initialOptions));
                const instanceDropdown = createInstanceDropdown(this, initialOptions, (newValue: string) => {
                    self.instanceName = newValue;
                });
                instanceDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                    const block = (this as any).getSourceBlock();
                    return getComponentInstances(block?.typeName || 'Button', block?.instanceName, block);
                };
                input.appendField(instanceDropdown, 'INSTANCE');
                instanceDropdown.setValue(self.instanceName);
                console.log(`[BLOCK DEBUG] After setValue, fieldValue=`, instanceDropdown.getValue());
            }

            const initialPropertyOptions = getComponentProperties(self.typeName, self.propertyName, self);
            console.log(`[BLOCK DEBUG] propertyOptions for ${self.typeName}:`, JSON.stringify(initialPropertyOptions));
            const propertyDropdown = new Blockly.FieldDropdown(initialPropertyOptions, (newValue: string) => {
                if (self.propertyName !== newValue) {
                    self.propertyName = newValue;
                    self.updateShape_();
                }
            });
            propertyDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                const block = (this as any).getSourceBlock();
                return getComponentProperties(block?.typeName || 'Button', block?.propertyName, block);
            };
            input.appendField('.');
            input.appendField(propertyDropdown, 'PROPERTY');
            if (self.propertyName && hasOption(initialPropertyOptions, self.propertyName)) {
                propertyDropdown.setValue(self.propertyName);
                console.log(`[BLOCK DEBUG] PROPERTY setValue to`, self.propertyName);
            }

            const componentDef = (COMPONENT_DATABASE as any)[self.typeName];
            const propDef = componentDef?.properties.find((p: any) => p.name === self.propertyName);
            if (propDef) {
                this.setOutput(true, propDef.type);
            }
        } finally {
            self.isUpdating = false;
        }
    }
};

Blockly.Blocks['component_set_property'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        (this as any).typeName = 'Button';
        (this as any).propertyName = 'Text';
        (this as any).instanceName = 'Button1';
        (this as any).isGeneric = false;

        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'property_name': self.propertyName,
            'instance_name': self.instanceName,
            'is_generic': self.isGeneric
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        console.log(`[BLOCK DEBUG] loadExtraState for ${self.type} state=${JSON.stringify(state)}`);
        self.typeName = state['component_type'];
        self.propertyName = state['property_name'];
        self.instanceName = state['instance_name'];
        self.isGeneric = state['is_generic'];
        self.updateShape_();
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('property_name', self.propertyName || '');
        container.setAttribute('instance_name', self.instanceName || '');
        container.setAttribute('is_generic', self.isGeneric ? 'true' : 'false');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Button';
        self.propertyName = xmlElement.getAttribute('property_name') || 'Text';
        self.instanceName = xmlElement.getAttribute('instance_name') || 'Button1';
        self.isGeneric = xmlElement.getAttribute('is_generic') === 'true';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.isUpdating) return;
        self.isUpdating = true;
        try {
            console.log(`[BLOCK DEBUG] updateShape_ for ${self.type || '?'} typeName=${self.typeName} instanceName=${self.instanceName} propertyName=${self.propertyName} isGeneric=${self.isGeneric}`);

            if (this.inputList.length > 0) this.removeInput('VALUE');
            const input = this.appendValueInput('VALUE').appendField('set ');
            if (self.isGeneric) {
                input.appendField('any ' + self.typeName);
            } else {
                const initialOptions = getComponentInstances(self.typeName, self.instanceName, self);
                console.log(`[BLOCK DEBUG] initialOptions for ${self.typeName}:`, JSON.stringify(initialOptions));
                const instanceDropdown = createInstanceDropdown(this, initialOptions, (newValue: string) => {
                    self.instanceName = newValue;
                });
                instanceDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                    const block = (this as any).getSourceBlock();
                    return getComponentInstances(block?.typeName || 'Button', block?.instanceName, block);
                };
                input.appendField(instanceDropdown, 'INSTANCE');
                instanceDropdown.setValue(self.instanceName);
                console.log(`[BLOCK DEBUG] After setValue, fieldValue=`, instanceDropdown.getValue());
            }

            const initialPropOptions = getComponentProperties(self.typeName, self.propertyName, self);
            console.log(`[BLOCK DEBUG] propertyOptions for ${self.typeName}:`, JSON.stringify(initialPropOptions));
            const propertyDropdown = new Blockly.FieldDropdown(initialPropOptions, (newValue: string) => {
                if (self.propertyName !== newValue) {
                    self.propertyName = newValue;
                    self.updateShape_();
                }
                return newValue;
            });
            propertyDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                const block = (this as any).getSourceBlock();
                return getComponentProperties(block?.typeName || 'Button', block?.propertyName, block);
            };
            input.appendField('.');
            input.appendField(propertyDropdown, 'PROPERTY');
            if (self.propertyName && hasOption(initialPropOptions, self.propertyName)) {
                propertyDropdown.setValue(self.propertyName);
            }
            input.appendField(' to');

            const componentDef = (COMPONENT_DATABASE as any)[self.typeName];
            const propDef = componentDef?.properties.find((p: any) => p.name === self.propertyName);
            if (propDef) {
                input.setCheck(propDef.type);
            }
        } finally {
            self.isUpdating = false;
        }
    }
};

Blockly.Blocks['component_component_block'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.getters);
        (this as any).typeName = 'Button';
        (this as any).instanceName = 'Button1';
        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'instance_name': self.instanceName
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        console.log(`[BLOCK DEBUG] loadExtraState for ${self.type} state=${JSON.stringify(state)}`);
        self.typeName = state['component_type'];
        self.instanceName = state['instance_name'];
        self.updateShape_();
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('instance_name', self.instanceName || '');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Button';
        self.instanceName = xmlElement.getAttribute('instance_name') || 'Button1';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.isUpdating) return;
        self.isUpdating = true;
        try {
            console.log(`[BLOCK DEBUG] updateShape_ for ${self.type || '?'} typeName=${self.typeName} instanceName=${self.instanceName}`);

            while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);
            const input = this.appendDummyInput('MAIN');

            const initialOptions = getComponentInstances(self.typeName, self.instanceName, self);
            console.log(`[BLOCK DEBUG] initialOptions for ${self.typeName}:`, JSON.stringify(initialOptions));
            const instanceDropdown = createInstanceDropdown(this, initialOptions, (newValue: string) => {
                self.instanceName = newValue;
            });
            instanceDropdown.menuGenerator_ = function (this: Blockly.FieldDropdown) {
                const block = (this as any).getSourceBlock();
                return getComponentInstances(block?.typeName || 'Button', block?.instanceName, block);
            };

            input.appendField(instanceDropdown, 'INSTANCE');
            instanceDropdown.setValue(self.instanceName);
            console.log(`[BLOCK DEBUG] After setValue, fieldValue=`, instanceDropdown.getValue());
            this.setOutput(true, 'Component');
        } finally {
            self.isUpdating = false;
        }
    }
};

Blockly.Blocks['any_component_event'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.events);
        (this as any).typeName = 'Button';
        (this as any).eventName = 'Click';
        (this as any).isGeneric = true;
        (this as any).updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_event'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_event'].loadExtraState,
    mutationToDom: Blockly.Blocks['component_event'].mutationToDom,
    domToMutation: Blockly.Blocks['component_event'].domToMutation,
    updateShape_: Blockly.Blocks['component_event'].updateShape_
};

Blockly.Blocks['any_component_method'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.methods);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        (this as any).typeName = 'Notifier';
        (this as any).methodName = 'ShowAlert';
        (this as any).isGeneric = true;
        (this as any).updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_method'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_method'].loadExtraState,
    mutationToDom: Blockly.Blocks['component_method'].mutationToDom,
    domToMutation: Blockly.Blocks['component_method'].domToMutation,
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        Blockly.Blocks['component_method'].updateShape_.call(this);
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
    }
};

Blockly.Blocks['any_component_get_property'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        (this as any).typeName = 'Button';
        (this as any).propertyName = 'Text';
        (this as any).isGeneric = true;
        (this as any).updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_get_property'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_get_property'].loadExtraState,
    mutationToDom: Blockly.Blocks['component_get_property'].mutationToDom,
    domToMutation: Blockly.Blocks['component_get_property'].domToMutation,
    updateShape_: function (this: Blockly.Block) {
        Blockly.Blocks['component_get_property'].updateShape_.call(this);
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
    }
};

Blockly.Blocks['any_component_set_property'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.setters);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        (this as any).typeName = 'Button';
        (this as any).propertyName = 'Text';
        (this as any).isGeneric = true;
        (this as any).updateShape_();
    },
    saveExtraState: Blockly.Blocks['component_set_property'].saveExtraState,
    loadExtraState: Blockly.Blocks['component_set_property'].loadExtraState,
    mutationToDom: Blockly.Blocks['component_set_property'].mutationToDom,
    domToMutation: Blockly.Blocks['component_set_property'].domToMutation,
    updateShape_: function (this: Blockly.Block) {
        Blockly.Blocks['component_set_property'].updateShape_.call(this);
        if (!this.getInput('COMPONENT')) {
            this.appendValueInput('COMPONENT')
                .setCheck('Component')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField('for component');
        }
        this.moveInputBefore('VALUE', null);
    }
};

Blockly.Blocks['component_choice'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.getters);
        this.setOutput(true);
        (this as any).typeName = 'Screen';
        (this as any).propertyName = 'ScreenOrientation';
        (this as any).choiceValue = 'Portrait';
        (this as any).updateShape_();
    },

    saveExtraState: function (this: Blockly.Block): any {
        const self = this as any;
        return {
            'component_type': self.typeName,
            'property_name': self.propertyName,
            'choice_value': self.choiceValue
        };
    },

    loadExtraState: function (this: Blockly.Block, state: any) {
        const self = this as any;
        self.typeName = state['component_type'];
        self.propertyName = state['property_name'];
        self.choiceValue = state['choice_value'];
        self.updateShape_();
    },

    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('component_type', self.typeName || '');
        container.setAttribute('property_name', self.propertyName || '');
        container.setAttribute('choice_value', self.choiceValue || '');
        return container;
    },

    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.typeName = xmlElement.getAttribute('component_type') || 'Screen';
        self.propertyName = xmlElement.getAttribute('property_name') || 'ScreenOrientation';
        self.choiceValue = xmlElement.getAttribute('choice_value') || '';
        self.updateShape_();
    },

    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        while (this.inputList.length > 0) this.removeInput(this.inputList[0].name);

        const componentDef = (COMPONENT_DATABASE as any)[self.typeName];
        const propDef = componentDef?.properties.find((p: any) => p.name === self.propertyName);
        const options = (propDef?.options && propDef.options.length > 0) ? propDef.options : ['No Options'];

        const dropdown = new Blockly.FieldDropdown(options.map((opt: string) => [opt, opt]), (newValue: string) => {
            self.choiceValue = newValue;
        });

        this.appendDummyInput('MAIN')
            .appendField(dropdown, 'CHOICE');

        if (options.includes(self.choiceValue)) {
            this.getField('CHOICE')!.setValue(self.choiceValue);
        }
        this.setOutput(true, propDef?.type || null);
    }
};

export function createComponentBlocks(appState: any): any[] {
    const blocks: any[] = [];

    const currentScreen = appState.screens?.find((s: any) => s.id === appState.activeScreen) || appState.screens?.[0];
    if (!currentScreen) return blocks;

    const flattenVisible = (list: any[] = []): any[] =>
        list.flatMap((item: any) => [item, ...(item.children ? flattenVisible(item.children) : [])]);

    const components = [
        ...flattenVisible(currentScreen.components || []),
        ...(currentScreen.nonVisibleComponents || [])
    ];

    components.forEach((comp: any) => {
        const componentDef = (COMPONENT_DATABASE as any)[comp.type];
        if (!componentDef) return;

        componentDef.events.forEach((event: any) => {
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

        componentDef.methods.forEach((method: any) => {
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

        componentDef.properties.forEach((prop: any) => {
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
