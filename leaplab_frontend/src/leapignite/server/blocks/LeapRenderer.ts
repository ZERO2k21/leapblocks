import Blockly from '@blockly-runtime';

let _registered = false;

export function registerLeapRenderer(blocklyInstance: any): void {
    if (_registered) return;
    _registered = true;

    const BaseConstantProvider = blocklyInstance.zelos.ConstantProvider;
    const BaseRenderer = blocklyInstance.zelos.Renderer;

    class LeapConstantProvider extends BaseConstantProvider {
        constructor() {
            super();

            const S = 1.0;

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

            this.FIELD_TEXT_FONTWEIGHT = '700';
            this.FIELD_TEXT_FONTFAMILY = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            this.FIELD_TEXT_FONTSIZE = Math.round(12 * S);

            this.CORNER_RADIUS = 6;
            this.CHECKBOX_SIZE = Math.round(16 * S);
            this.CHECKBOX_CORNER_RADIUS = Math.round(4 * S);
            this.CHECKBOX_X_OFFSET = Math.round(8 * S);
        }
    }

    class LeapRenderer extends BaseRenderer {
        constructor(name: string) {
            super(name);
        }

        makeConstants_(): LeapConstantProvider {
            return new LeapConstantProvider();
        }
    }

    if (blocklyInstance && blocklyInstance.blockRendering) {
        blocklyInstance.blockRendering.register('leap', LeapRenderer);
    }
}
