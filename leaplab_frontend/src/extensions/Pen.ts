// Pen.ts - Drawing with pen on stage
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. pen_clear:              Erase all pen drawings
// 2. pen_stamp:              Stamp current costume
// 3. pen_penDown:            Put pen down (start drawing)
// 4. pen_penUp:              Put pen up (stop drawing)
// 5. pen_setPenColorToColor: Set pen color to a specific color
// 6. pen_setPenColorToNumber: Set pen color by number
// 7. pen_changePenSizeBy:    Change pen size by amount
// 8. pen_setPenSizeTo:       Set pen size to specific value

import Blockly from '@blockly-runtime';

export class PenRuntime {
    private _penDown = false;
    private _penColor = '#000000';
    private _penSize = 1;
    private _penTrails: { x: number; y: number; color: string; size: number }[] = [];
    private _stampTrails: { x: number; y: number; costume: string }[] = [];

    eraseAll(): void {
        this._penTrails = [];
        this._stampTrails = [];
        console.log('[Pen] Erased all');
    }

    stamp(): void {
        const spriteId = (window as any).__activeSpriteId;
        if (!spriteId || !(window as any).spriteManager) return;

        const sprite = (window as any).spriteManager.getSprite(spriteId);
        if (!sprite) return;

        this._stampTrails.push({
            x: sprite.x,
            y: sprite.y,
            costume: sprite.currentCostume,
        });
    }

    penDown(): void {
        this._penDown = true;
        this.drawPoint();
    }

    penUp(): void {
        this._penDown = false;
    }

    setColor(color: string): void {
        this._penColor = color;
    }

    setColorByNumber(colorNum: number): void {
        // Convert number to HSL color
        const hue = (colorNum * 3.6) % 360;
        this._penColor = `hsl(${hue}, 100%, 50%)`;
    }

    changeSize(delta: number): void {
        this._penSize = Math.max(1, this._penSize + delta);
    }

    setSize(size: number): void {
        this._penSize = Math.max(1, size);
    }

    private drawPoint(): void {
        const spriteId = (window as any).__activeSpriteId;
        if (!spriteId || !(window as any).spriteManager) return;

        const sprite = (window as any).spriteManager.getSprite(spriteId);
        if (!sprite) return;

        this._penTrails.push({
            x: sprite.x,
            y: sprite.y,
            color: this._penColor,
            size: this._penSize,
        });
    }

    getTrails(): typeof this._penTrails {
        return this._penTrails;
    }

    getStamps(): typeof this._stampTrails {
        return this._stampTrails;
    }

    isPenDown(): boolean {
        return this._penDown;
    }

    destroy(): void {
        this._penTrails = [];
        this._stampTrails = [];
    }
}

export const penBlocks = [
    {
        type: 'pen_clear',
        message0: 'erase all',
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Erase all pen drawings',
        helpUrl: ''
    },
    {
        type: 'pen_stamp',
        message0: 'stamp',
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Stamp current costume',
        helpUrl: ''
    },
    {
        type: 'pen_penDown',
        message0: 'pen down',
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Put pen down (start drawing)',
        helpUrl: ''
    },
    {
        type: 'pen_penUp',
        message0: 'pen up',
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Put pen up (stop drawing)',
        helpUrl: ''
    },
    {
        type: 'pen_setPenColorToColor',
        message0: 'set pen color to %1',
        args0: [{
            type: 'field_colour',
            name: 'COLOR',
            colour: '#ff0000'
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Set pen color to a specific color',
        helpUrl: ''
    },
    {
        type: 'pen_setPenColorToNumber',
        message0: 'set pen color to %1',
        args0: [{
            type: 'field_number',
            name: 'COLOR',
            value: 50,
            min: 0,
            max: 200
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Set pen color by number',
        helpUrl: ''
    },
    {
        type: 'pen_changePenSizeBy',
        message0: 'change pen size by %1',
        args0: [{
            type: 'field_number',
            name: 'SIZE',
            value: 1
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Change pen size by amount',
        helpUrl: ''
    },
    {
        type: 'pen_setPenSizeTo',
        message0: 'set pen size to %1',
        args0: [{
            type: 'field_number',
            name: 'SIZE',
            value: 1
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#0FBD8C',
        tooltip: 'Set pen size to specific value',
        helpUrl: ''
    },
];

export function registerPenBlocks() {
    const newBlocks = penBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const penExtension = {
    id: 'pen',
    name: 'Pen',
    colour: '#0FBD8C',
    icon: '✏️',
    blocks: penBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
