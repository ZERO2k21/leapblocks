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
        try {
            const block = this.getSourceBlock();
            if (block) {
                const color = block.getColour();
                document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
                const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
                document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
            }
        } catch (e) {
            console.warn('[Blockly Patch] Failed to set dropdown colors:', e);
        }

        // HEALING: If the field's current value is an object (due to a previous bug), 
        // convert it back to a string before opening the editor to prevent crashes.
        if (typeof (this as any).value_ === 'object' && (this as any).value_ !== null) {
            const val = (this as any).value_;
            (this as any).value_ = val.name || val.id || String(val);
        }

        if (typeof origShowEditor === 'function') {
            try {
                origShowEditor.call(this, opt_e);
            } catch (e) {
                console.error('[Blockly Patch] Error in origShowEditor:', e);
            }
        }
    };
    (Blockly.FieldDropdown.prototype as any)._dropdownColorsPatched = true;
}

// 2. FALLBACK TRANSLATIONS FOR VARIABLES
// Prevents appendChild errors in MenuItem.createDom when Blockly attempts to render 
// "Rename Variable" or "Delete Variable" items without valid translations.
if (Blockly.Msg) {
    Blockly.Msg['DELETE_VARIABLE'] = Blockly.Msg['DELETE_VARIABLE'] || 'Delete the "%1" variable';
    Blockly.Msg['RENAME_VARIABLE'] = Blockly.Msg['RENAME_VARIABLE'] || 'Rename variable...';
    Blockly.Msg['RENAME_VARIABLE_TITLE'] = Blockly.Msg['RENAME_VARIABLE_TITLE'] || 'Rename all "%1" variables to:';
    Blockly.Msg['NEW_VARIABLE'] = Blockly.Msg['NEW_VARIABLE'] || 'New variable...';
    Blockly.Msg['NEW_VARIABLE_TITLE'] = Blockly.Msg['NEW_VARIABLE_TITLE'] || 'New variable name:';
    Blockly.Msg['VARIABLE_ALREADY_EXISTS'] = Blockly.Msg['VARIABLE_ALREADY_EXISTS'] || 'A variable named "%1" already exists.';
    Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'] = Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'] || 'A variable named "%1" already exists for another type: "%2".';
    Blockly.Msg['DELETE_VARIABLE_CONFIRMATION'] = Blockly.Msg['DELETE_VARIABLE_CONFIRMATION'] || 'Delete %1 uses of the "%2" variable?';
    Blockly.Msg['CANNOT_DELETE_VARIABLE_PROCEDURE'] = Blockly.Msg['CANNOT_DELETE_VARIABLE_PROCEDURE'] || 'Can\'t delete the variable "%1" because it\'s part of the definition of the function "%2".';
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

// 3. OVERRIDE DEFAULT VARIABLE NAME GENERATION
// Blockly's default uses VAR_LETTER_OPTIONS = "ijkmnopqrstuvwxyzabcdefgh" which produces
// confusing auto-created variables named "i", "j", "k", etc. Override to use "variable", "variable2", etc.
if ((Blockly as any).Variables) {
    const Variables = (Blockly as any).Variables;
    Variables.generateUniqueName = function (workspace: any) {
        const targetWs = workspace.isFlyout ? workspace.targetWorkspace : workspace;
        const allVars = targetWs.getVariableMap().getAllVariables().map((v: any) => v.getName().toLowerCase());
        // Try "variable" first, then "variable2", "variable3", etc.
        let candidate = 'variable';
        let suffix = 2;
        while (allVars.includes(candidate.toLowerCase())) {
            candidate = `variable${suffix}`;
            suffix++;
        }
        return candidate;
    };
    // Also override the internal version used by TEST_ONLY
    if (Variables.TEST_ONLY) {
        Variables.TEST_ONLY.generateUniqueNameInternal = Variables.generateUniqueName;
    }
}

// 4. PREVENT FIELD_VARIABLE FROM AUTO-CREATING VARIABLES IN FLYOUT
// When blocks with field_variable are created in the flyout, FieldVariable.initModel()
// calls getOrCreateVariablePackage() which auto-creates variables if the default name
// (e.g., "my variable") doesn't exist. Patch initModel to skip creation in flyout workspaces.
if (Blockly.FieldVariable && !(Blockly.FieldVariable.prototype as any)._initModelPatched) {
    const origInitModel = (Blockly.FieldVariable.prototype as any).initModel;
    (Blockly.FieldVariable.prototype as any).initModel = function (this: any) {
        const block = this.getSourceBlock();
        if (block && block.workspace && block.workspace.isFlyout) {
            // In flyout: only resolve existing variables, don't create new ones
            if (!this.variable) {
                const ws = block.workspace;
                const mainWs = ws.targetWorkspace || ws;
                const name = this.defaultVariableName || 'variable';
                const type = this.defaultType || '';
                // Try to find existing variable by name across accepted types
                const variableTypes = this.variableTypes || [type];
                let found = null;
                for (const vt of variableTypes) {
                    found = mainWs.getVariable(name, vt);
                    if (found) break;
                }
                // Fallback: use the first available variable of any accepted type
                if (!found) {
                    const allVars = mainWs.getVariableMap().getAllVariables();
                    for (const v of allVars) {
                        if (variableTypes.includes(v.type) || variableTypes.includes('')) {
                            found = v;
                            break;
                        }
                    }
                }
                if (found) {
                    this.doValueUpdate_(found.getId());
                } else {
                    // No variables exist yet — call original which will create one with our patched name generator
                    if (origInitModel) origInitModel.call(this);
                }
            }
        } else {
            // Not in flyout: use original behavior
            if (origInitModel) origInitModel.call(this);
        }
    };
    (Blockly.FieldVariable.prototype as any)._initModelPatched = true;
}

export * from 'blockly/core';
export { javascriptGenerator } from 'blockly/javascript';
export default Blockly;
