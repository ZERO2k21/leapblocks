import * as Blockly from 'blockly/core';

// Load Blockly extensions in a stable order before any app modules touch them.
import 'blockly/blocks';
import 'blockly/javascript';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL BLOCKLY OVERRIDES & PATCHES
// ═══════════════════════════════════════════════════════════════════════════

// 1. DYNAMIC DROPDOWN COLORS
// Update highlight and background color based on block color when opening a dropdown
if (Blockly.FieldDropdown && !(Blockly.FieldDropdown.prototype as any)._originalShowEditor) {
    (Blockly.FieldDropdown.prototype as any)._originalShowEditor = (Blockly.FieldDropdown.prototype as any).showEditor_;
    (Blockly.FieldDropdown.prototype as any).showEditor_ = function (this: any, opt_e: any) {
        const block = this.getSourceBlock();
        if (block) {
            const color = block.getColour();
            document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
            // Add a subtle tint for the background (10% opacity)
            const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
            document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
        }

        // SAFETY: Only call the original if it exists. 
        // This avoids issues where subclasses (like FieldVariable) might have different prototype chains.
        const original = (this as any)._originalShowEditor;
        if (typeof original === 'function') {
            original.call(this, opt_e);
        }
    };
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
