import Blockly from '@blockly-runtime';
import { FieldAngle } from '@blockly/field-angle';
import { FieldColour } from '@blockly/field-colour';

declare global {
    interface Window {
        __leapblocksBlocklyFieldsRegistered?: boolean;
    }
}

export function registerCustomFields(): void {
    const globalWindow = window as Window;

    if (!globalWindow.__leapblocksBlocklyFieldsRegistered) {
        if (!Blockly.registry.hasItem(Blockly.registry.Type.FIELD, 'field_angle')) {
            Blockly.fieldRegistry.register('field_angle', FieldAngle);
        }

        if (!Blockly.registry.hasItem(Blockly.registry.Type.FIELD, 'field_colour')) {
            Blockly.fieldRegistry.register('field_colour', FieldColour);
        }

        globalWindow.__leapblocksBlocklyFieldsRegistered = true;
    }
}

// Auto-register when imported (for backward compat with dynamic import)
registerCustomFields();
