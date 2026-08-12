/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';
import { FieldAngle } from '@blockly/field-angle';
import { FieldColour } from '@blockly/field-colour';

declare global {
    interface Window {
        __leapblocksBlocklyFieldsRegistered?: boolean;
    }
}

/**
 * Directly force the colour field's visual swatch to reflect its current value.
 * This bypasses the normal render cycle (which is skipped because FieldColour
 * sets isDirty_ = false) and manipulates the SVG elements directly.
 */
function forceColourFieldUpdateVisual(field: any): void {
    try {
        const block = field.getSourceBlock?.();
        if (!block) return;

        // Method 1: Use applyColour if available (FieldColour override)
        if (typeof field.applyColour === 'function') {
            field.applyColour();
        }

        // Method 2: Directly update the border rect SVG element
        const borderRect = field.borderRect_;
        if (borderRect && typeof field.getValue === 'function') {
            const colour = field.getValue();
            if (colour && typeof colour === 'string') {
                borderRect.style.fill = colour;
                borderRect.style.display = 'block';
            }
        }

        // Method 3: Also update via the block's applyColour which calls all fields
        if (typeof block.applyColour === 'function') {
            block.applyColour();
        }
    } catch (_) {
        // Field may not be fully attached yet
    }
}

let _fieldColourPatched = false;

function patchFieldColour(): void {
    if (_fieldColourPatched) return;
    _fieldColourPatched = true;

    // ── Patch 1: doValueUpdate_ ──────────────────────────────────────────
    // FieldColour sets isDirty_ = false which prevents the normal render
    // cycle from calling applyColour(). We override doValueUpdate_ to
    // force the colour swatch to update immediately AND schedule a
    // follow-up update to survive any async re-renders triggered by
    // Blockly events.
    // Walk the prototype chain to get the parent class's doValueUpdate_
    let parentDoValueUpdate: Function | null = null;
    let proto = Object.getPrototypeOf(FieldColour.prototype);
    while (proto && proto !== Object.prototype) {
        if (proto.hasOwnProperty('doValueUpdate_')) {
            parentDoValueUpdate = proto.doValueUpdate_;
            break;
        }
        proto = Object.getPrototypeOf(proto);
    }
    (FieldColour.prototype as any).doValueUpdate_ = function (this: any, newValue: any) {
        if (parentDoValueUpdate) parentDoValueUpdate.call(this, newValue);

        // Immediate visual update
        forceColourFieldUpdateVisual(this);

        // Deferred update: Blockly may fire BLOCK_CHANGE events that trigger
        // an async re-render resetting the colour. Schedule a follow-up to
        // re-apply after the current event loop.
        const self = this;
        setTimeout(function () {
            forceColourFieldUpdateVisual(self);
        }, 0);

        // Double-deferred update: some Blockly operations use requestAnimationFrame
        requestAnimationFrame(function () {
            forceColourFieldUpdateVisual(self);
        });
    };

    // ── Patch 2: showEditor_ ─────────────────────────────────────────────
    // When the dropdown closes, the dispose callback may trigger a re-render
    // that resets the colour. We wrap showEditor_ to add a post-close hook
    // that re-applies the colour after the dropdown hides.
    const origShowEditor = (FieldColour.prototype as any).showEditor_;
    (FieldColour.prototype as any).showEditor_ = function (this: any, e?: MouseEvent) {
        if (origShowEditor) origShowEditor.call(this, e);

        // Ensure the CSS class for the colour grid is always applied
        try {
            const contentDiv = Blockly.DropDownDiv.getContentDiv();
            if (contentDiv && !contentDiv.classList.contains('blocklyFieldColour')) {
                contentDiv.classList.add('blocklyFieldColour');
            }
        } catch (_) {}

        // Hook into dropdown hide: re-apply colour after the dropdown closes
        // because hideIfOwner may trigger a re-render with stale colour
        const self = this;
        const origHideIfOwner = Blockly.DropDownDiv.hideIfOwner;
        if (typeof origHideIfOwner === 'function' &&
            !(Blockly.DropDownDiv as any).__leapblocksHidePatched) {
            (Blockly.DropDownDiv as any).__leapblocksHidePatched = true;
            (Blockly.DropDownDiv as any).hideIfOwner = function (owner: any) {
                const result = origHideIfOwner.call(this, owner);
                // Re-apply colour for any FieldColour that was the dropdown owner
                if (owner && typeof owner.getValue === 'function' &&
                    typeof owner.applyColour === 'function') {
                    setTimeout(function () {
                        forceColourFieldUpdateVisual(owner);
                    }, 0);
                }
                return result;
            };
        }
    };


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

        patchFieldColour();

        globalWindow.__leapblocksBlocklyFieldsRegistered = true;
    }
}
