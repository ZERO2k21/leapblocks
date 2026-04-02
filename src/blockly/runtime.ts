import * as Blockly from 'blockly/core';

// Load Blockly extensions in a stable order before any app modules touch them.
import 'blockly/blocks';
import 'blockly/javascript';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL BLOCKLY OVERRIDES & PATCHES
// ═══════════════════════════════════════════════════════════════════════════

// 1. DYNAMIC DROPDOWN COLORS
// Update highlight and background color based on block color when opening a dropdown.
// We use showEditor_ instead of onMouseDown_ to avoid interfering with Blockly's gesture system
// (which can lead to "Tried to start the same gesture twice" errors).
if (Blockly.FieldDropdown && !(Blockly.FieldDropdown.prototype as any)._dropdownColorsPatched) {
    const origShowEditor = (Blockly.FieldDropdown.prototype as any).showEditor_;
    (Blockly.FieldDropdown.prototype as any).showEditor_ = function (this: any, opt_e?: any) {
        const block = this.getSourceBlock();
        if (block) {
            const color = block.getColour();
            document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
            const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
            document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
        }

        // HEALING: If the field's current value is an object (due to a previous bug), 
        // convert it back to a string before opening the editor to prevent crashes.
        if (typeof (this as any).value_ === 'object' && (this as any).value_ !== null) {
            const val = (this as any).value_;
            (this as any).value_ = val.name || val.id || String(val);
        }

        if (typeof origShowEditor === 'function') {
            origShowEditor.call(this, opt_e);
        }
    };
    (Blockly.FieldDropdown.prototype as any)._dropdownColorsPatched = true;
}

// 2. FALLBACK TRANSLATIONS FOR VARIABLES
// Prevents appendChild errors in MenuItem.createDom when Blockly attempts to render 
// "Rename Variable" or "Delete Variable" items without valid translations.
if (Blockly.Msg) {
    Blockly.Msg['DELETE_VARIABLE'] = Blockly.Msg['DELETE_VARIABLE'] || 'Delete the "%1" variable';
}

// 2. DROPDOWN ARROW COLORS
// Force all dropdown arrows to be black/dark for better visibility on LeapBlocks themes
if (Blockly.FieldDropdown && !(Blockly.FieldDropdown.prototype as any)._arrowColourPatched) {
    const origApplyColour = (Blockly.FieldDropdown.prototype as any).applyColour;
    (Blockly.FieldDropdown.prototype as any).applyColour = function (this: any) {
        if (origApplyColour) origApplyColour.call(this);

        // Handle both property naming conventions (svgArrow / svgArrow_)
        const svgArrow = this.svgArrow_ || this.svgArrow;
        if (svgArrow && svgArrow.style) {
            svgArrow.style.filter = 'brightness(0)';
        }

        // Handle text-based arrow element
        const arrow = this.arrow_ || this.arrow;
        if (arrow) {
            try {
                const arrowEl = arrow.getSvgRoot ? arrow.getSvgRoot() : arrow;
                if (arrowEl && arrowEl.style) arrowEl.style.fill = '#333333';
                if (arrowEl && arrowEl.setAttribute) arrowEl.setAttribute('fill', '#333333');
            } catch (e) { /* ignore */ }
        }

        // Fallback: find any image child within the field group
        try {
            const fieldGroup = this.fieldGroup_ || this.fieldGroup;
            if (fieldGroup) {
                const images = fieldGroup.querySelectorAll('image');
                images.forEach((img: any) => { img.style.filter = 'brightness(0)'; });
            }
        } catch (e) { /* ignore */ }
    };
    (Blockly.FieldDropdown.prototype as any)._arrowColourPatched = true;
}

export * from 'blockly/core';
export { javascriptGenerator } from 'blockly/javascript';
export default Blockly;
