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

            // Toy-like overrides (Junior Style)
            this.CORNER_RADIUS = 8; // Match PictoBlox/leapJr (less round than 24)
            this.notchOffsetLeft_ = 12; // Standard
            this.MIN_BLOCK_HEIGHT = 48; // Chunky but not huge (Horizontal layout handles width)
            this.TOP_ROW_MIN_HEIGHT = 10;
            this.BOTTOM_ROW_MIN_HEIGHT = 10;

            // Font
            this.FIELD_TEXT_FONTWEIGHT = '700'; // Bold text
            this.FIELD_TEXT_FONTFAMILY = '"Nunito", "Rounded Mplus 1c", sans-serif';

            // Checkbox styling (Premium feel)
            this.CHECKBOX_SIZE = 16;
            this.CHECKBOX_CORNER_RADIUS = 4;
            this.CHECKBOX_X_OFFSET = 8;
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
