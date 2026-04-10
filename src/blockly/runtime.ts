import * as Blockly from 'blockly/core';

// Load Blockly extensions in a stable order before any app modules touch them.
import 'blockly/blocks';
import 'blockly/javascript';

export const LEAP_CUSTOM_BLOCK_CONTEXT_MENU_FLAG = '__leap_custom_block_context_menu__';

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

const BLOCK_MENU_WEIGHT_DUPLICATE = 1;
const BLOCK_MENU_WEIGHT_COMMENT = 2;
const BLOCK_MENU_WEIGHT_INLINE = 3;
const BLOCK_MENU_WEIGHT_COLLAPSE = 4;
const BLOCK_MENU_WEIGHT_DISABLE = 5;
const BLOCK_MENU_WEIGHT_DELETE = 6;
const BLOCK_MENU_WEIGHT_HELP = 7;

const HIDDEN_BLOCK_MENU_WEIGHTS = new Set([
    BLOCK_MENU_WEIGHT_INLINE,
    BLOCK_MENU_WEIGHT_COLLAPSE,
    BLOCK_MENU_WEIGHT_DISABLE,
    BLOCK_MENU_WEIGHT_HELP,
]);

const canCopyBlock = (block: any): boolean => {
    if (!block || typeof block.toCopyData !== 'function') return false;
    if (typeof block.isCopyable === 'function') return !!block.isCopyable();
    return true;
};

const exportBlockAsImage = (block: any): void => {
    const svgRoot = block?.getSvgRoot?.();
    if (!svgRoot) return;

    let bounds: DOMRect | SVGRect;
    try {
        bounds = svgRoot.getBBox();
    } catch (error) {
        console.warn('[Blockly Patch] Unable to measure block for image export:', error);
        return;
    }

    const padding = 16;
    const width = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(1, Math.ceil(bounds.height + padding * 2));
    const minX = bounds.x - padding;
    const minY = bounds.y - padding;
    const svgNs = 'http://www.w3.org/2000/svg';
    const exportSvg = document.createElementNS(svgNs, 'svg');
    exportSvg.setAttribute('xmlns', svgNs);
    exportSvg.setAttribute('width', String(width));
    exportSvg.setAttribute('height', String(height));
    exportSvg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);

    const style = document.createElementNS(svgNs, 'style');
    style.textContent = `
        text {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
    `;
    exportSvg.appendChild(style);
    exportSvg.appendChild(svgRoot.cloneNode(true));

    const serialized = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
        const scale = Math.max(1, window.devicePixelRatio || 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
            URL.revokeObjectURL(svgUrl);
            return;
        }

        context.scale(scale, scale);
        context.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((pngBlob) => {
            if (!pngBlob) return;
            const downloadUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            const safeType = String(block.type || 'block').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase();
            link.href = downloadUrl;
            link.download = `${safeType || 'block'}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        }, 'image/png');
    };

    image.onerror = (error) => {
        URL.revokeObjectURL(svgUrl);
        console.warn('[Blockly Patch] Failed to export block as image:', error);
    };

    image.src = svgUrl;
};

if (Blockly.BlockSvg && !(Blockly.BlockSvg.prototype as any)._leapContextMenuPatched) {
    const originalGenerateContextMenu = (Blockly.BlockSvg.prototype as any).generateContextMenu;

    (Blockly.BlockSvg.prototype as any).generateContextMenu = function (this: any, e: Event) {
        const workspace = this.workspace;
        if (!workspace || workspace.isFlyout || !(workspace as any)[LEAP_CUSTOM_BLOCK_CONTEXT_MENU_FLAG]) {
            return typeof originalGenerateContextMenu === 'function'
                ? originalGenerateContextMenu.call(this, e)
                : null;
        }

        const baseMenu = typeof originalGenerateContextMenu === 'function'
            ? originalGenerateContextMenu.call(this, e)
            : [];

        if (!Array.isArray(baseMenu)) return baseMenu;

        const filteredMenu = baseMenu
            .filter((option: any) => {
                if (!option || option.separator === true) return false;
                return !HIDDEN_BLOCK_MENU_WEIGHTS.has(option.weight);
            })
            .map((option: any) => {
                if (option.weight === BLOCK_MENU_WEIGHT_DUPLICATE) {
                    return { ...option, text: 'Duplicate' };
                }
                if (option.weight === BLOCK_MENU_WEIGHT_DELETE) {
                    return { ...option, text: 'Delete Block' };
                }
                if (option.weight === BLOCK_MENU_WEIGHT_COMMENT) {
                    return {
                        ...option,
                        text: this.getCommentText?.() ? 'Remove Comment' : 'Add Comment',
                    };
                }
                return option;
            });

        const copyOption = canCopyBlock(this) ? {
            enabled: true,
            scope: { block: this, workspace, focusedNode: this },
            text: 'Copy Block',
            weight: 1.5,
            callback: () => {
                const copyLocation = this.getRelativeToSurfaceXY?.();
                Blockly.clipboard.copy(this, copyLocation);
            },
        } : null;

        const exportOption = {
            enabled: true,
            scope: { block: this, workspace, focusedNode: this },
            text: 'Export Block as Image',
            weight: 99,
            callback: () => exportBlockAsImage(this),
        };

        const duplicateIndex = filteredMenu.findIndex((option: any) => option?.weight === BLOCK_MENU_WEIGHT_DUPLICATE);
        if (copyOption) {
            if (duplicateIndex >= 0) {
                filteredMenu.splice(duplicateIndex + 1, 0, copyOption);
            } else {
                filteredMenu.unshift(copyOption);
            }
        }
        filteredMenu.push(exportOption);

        return filteredMenu;
    };

    (Blockly.BlockSvg.prototype as any)._leapContextMenuPatched = true;
}

// 5. SAFE EVENT UNBINDING
// Prevents "Cannot read properties of undefined (reading '2')" in browser_events.unbind
// which can occur during rapid workspace switching or disposal of flyout items.
const bEvents = (Blockly as any).browserEvents;
if (bEvents && typeof bEvents.unbind === 'function' && !bEvents._unbindPatched) {
    const origUnbind = bEvents.unbind;
    bEvents.unbind = function (bindData: any) {
        if (!Array.isArray(bindData) || bindData.length < 3 || !bindData[0] || !bindData[2]) {
            // Silently skip if invalid. Logging every skip might be too noisy in some edge cases.
            return;
        }
        try {
            origUnbind(bindData);
        } catch (err) {
            console.warn('[Blockly Patch] Error during browserEvents.unbind:', err);
        }
    };
    browserEvents._unbindPatched = true;
}

export * from 'blockly/core';
export { javascriptGenerator } from 'blockly/javascript';
export default Blockly;
