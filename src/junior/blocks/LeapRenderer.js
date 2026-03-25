
import * as Blockly from '@blockly-runtime';



const BaseConstantProvider = Blockly.zelos ? Blockly.zelos.ConstantProvider : Blockly.blockRendering.ConstantProvider;
const BaseRenderer = Blockly.zelos ? Blockly.zelos.Renderer : Blockly.blockRendering.Renderer;

export class LeapConstantProvider extends BaseConstantProvider {
    constructor() {
        super();

        // Toy-like overrides (Junior Style)
        this.CORNER_RADIUS = 8; // Match PictoBlox/ScratchJr (less round than 24)
        this.notchOffsetLeft_ = 12; // Standard
        this.MIN_BLOCK_HEIGHT = 48; // Chunky but not huge (Horizontal layout handles width)
        this.TOP_ROW_MIN_HEIGHT = 10;
        this.BOTTOM_ROW_MIN_HEIGHT = 10;

        // Font
        this.FIELD_TEXT_FONTWEIGHT = '700'; // Bold text
        this.FIELD_TEXT_FONTFAMILY = '"Nunito", "Rounded Mplus 1c", sans-serif';
    }
}

export class LeapRenderer extends BaseRenderer {
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

export function registerLeapRenderer(blocklyInstance) {
    if (blocklyInstance && blocklyInstance.blockRendering) {
        blocklyInstance.blockRendering.register('leap', LeapRenderer);
    }
}
