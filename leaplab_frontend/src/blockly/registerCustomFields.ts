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

        field.isDirty_ = true;

        const colour = field.getValue?.();
        const borderRect = field.borderRect_;
        if (borderRect && colour && typeof colour === 'string') {
            borderRect.style.setProperty('fill', colour, 'important');
            borderRect.style.setProperty('fill-opacity', '1', 'important');
            borderRect.style.display = 'block';
        }

        // Method 1: Use applyColour if available (FieldColour override)
        if (typeof field.applyColour === 'function') {
            field.applyColour();
        }

        if (borderRect && colour && typeof colour === 'string') {
            borderRect.style.setProperty('fill', colour, 'important');
            borderRect.style.setProperty('fill-opacity', '1', 'important');
        }

        // Method 3: Trigger block render/queueRender if attached
        if (typeof block.queueRender === 'function') {
            block.queueRender();
        } else if (typeof block.render === 'function') {
            block.render();
        }
    } catch (_) {
        // Field may not be fully attached yet
    }
}

let _fieldColourPatched = false;

function patchFieldColour(): void {
    if (_fieldColourPatched) return;
    _fieldColourPatched = true;

    // ── Patch 1: initView ─────────────────────────────────────────────────
    // Tag borderRect_ and fieldGroup_ with CSS classes and apply high-priority inline fill
    const origInitView = FieldColour.prototype.initView;
    FieldColour.prototype.initView = function (this: any) {
        if (origInitView) origInitView.call(this);

        if (this.borderRect_) {
            this.borderRect_.classList.add('blocklyFieldColourRect');
            const colour = typeof this.getValue === 'function' ? this.getValue() : null;
            if (colour && typeof colour === 'string') {
                this.borderRect_.style.setProperty('fill', colour, 'important');
                this.borderRect_.style.setProperty('fill-opacity', '1', 'important');
            }
        }
        if (this.fieldGroup_) {
            this.fieldGroup_.classList.add('blocklyFieldColourGroup');
        }
    };

    // ── Patch 2: applyColour ──────────────────────────────────────────────
    // Ensure applyColour sets fill with 'important' to override any global CSS
    const origApplyColour = (FieldColour.prototype as any).applyColour;
    (FieldColour.prototype as any).applyColour = function (this: any) {
        if (origApplyColour) {
            try {
                origApplyColour.call(this);
            } catch (_) {}
        }
        const borderRect = this.borderRect_;
        const colour = typeof this.getValue === 'function' ? this.getValue() : null;
        if (borderRect && colour && typeof colour === 'string') {
            borderRect.style.setProperty('fill', colour, 'important');
            borderRect.style.setProperty('fill-opacity', '1', 'important');
            borderRect.style.display = 'block';
        }
    };

    // ── Patch 3: setValue ─────────────────────────────────────────────────
    const origSetValue = FieldColour.prototype.setValue;
    FieldColour.prototype.setValue = function (this: any, newValue: any) {
        if (origSetValue) origSetValue.call(this, newValue);
        this.isDirty_ = true;
        forceColourFieldUpdateVisual(this);
    };

    // ── Patch 4: doValueUpdate_ ──────────────────────────────────────────
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
        this.isDirty_ = true;

        // Immediate visual update
        forceColourFieldUpdateVisual(this);

        // Deferred updates to survive async re-renders
        const self = this;
        setTimeout(function () {
            forceColourFieldUpdateVisual(self);
        }, 0);

        requestAnimationFrame(function () {
            forceColourFieldUpdateVisual(self);
        });
    };

    // ── Patch 5: showEditor_ ─────────────────────────────────────────────
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
        const self = this;
        const origHideIfOwner = Blockly.DropDownDiv.hideIfOwner;
        if (typeof origHideIfOwner === 'function' &&
            !(Blockly.DropDownDiv as any).__leapblocksHidePatched) {
            (Blockly.DropDownDiv as any).__leapblocksHidePatched = true;
            (Blockly.DropDownDiv as any).hideIfOwner = function (owner: any) {
                const result = origHideIfOwner.call(this, owner);
                if (owner && typeof owner.getValue === 'function') {
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
