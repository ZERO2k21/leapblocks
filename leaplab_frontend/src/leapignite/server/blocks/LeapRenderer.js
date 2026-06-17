/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';

let _registered = false;

export function registerLeapRenderer(blocklyInstance) {
    if (_registered) return;
    _registered = true;

    // We inherit from zelos to get the leap block styling
    // Class definitions are inside this function to avoid TDZ errors
    // when webpack chunk splitting evaluates this module before Blockly.
    const BaseConstantProvider = blocklyInstance.zelos.ConstantProvider;
    const BaseRenderer = blocklyInstance.zelos.Renderer;

    class LeapConstantProvider extends BaseConstantProvider {
        constructor() {
            super();

            // ═══════════════════════════════════════════════════════════════
            // GLOBAL BLOCK SCALE — single parameter to resize ALL blocks
            // 1.0 = default size, 0.85 = 15% smaller, 1.15 = 15% larger
            // Affects: block height, padding, font size, field spacing
            // ═══════════════════════════════════════════════════════════════
            const S = 1.0;

            // Toy-like overrides (Junior Style)
            this.CORNER_RADIUS = 6;
            this.notchOffsetLeft_ = 12;
            this.MIN_BLOCK_HEIGHT = Math.round(40 * S);
            this.TOP_ROW_MIN_HEIGHT = Math.round(6 * S);
            this.BOTTOM_ROW_MIN_HEIGHT = Math.round(6 * S);
            this.FIELD_Y_OFFSET = Math.round(3 * S);
            this.SMALL_PADDING = Math.round(6 * S);
            this.MEDIUM_PADDING = Math.round(16 * S);
            this.LARGE_PADDING = Math.round(22 * S);
            this.FIELD_BORDER_RECT_X_PADDING = Math.round(8 * S);

            // Font
            this.FIELD_TEXT_FONTWEIGHT = '700';
            this.FIELD_TEXT_FONTFAMILY = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            this.FIELD_TEXT_FONTSIZE = Math.round(12 * S);

            // Checkbox styling (Premium feel)
            this.CORNER_RADIUS = 6;
            this.CHECKBOX_SIZE = Math.round(16 * S);
            this.CHECKBOX_CORNER_RADIUS = Math.round(4 * S);
            this.CHECKBOX_X_OFFSET = Math.round(8 * S);
        }
    }

    class LeapRenderer extends BaseRenderer {
        constructor(name) {
            super(name);
        }

        /**
         * Create a new instance of the renderer constant provider.
         * @return {!LeapConstantProvider} The new constant provider.
         * @protected
         * @override
         */
        makeConstants_() {
            return new LeapConstantProvider();
        }
    }

    if (blocklyInstance && blocklyInstance.blockRendering) {
        blocklyInstance.blockRendering.register('leap', LeapRenderer);
    }
}
