import { Extension, ExtensionInfo } from '../core/Extension';

export class PenExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'pen',
            name: 'Pen',
            color1: '#0FBD8C',
            blocks: [
                { opcode: 'pen_clear', blockType: 'command', text: 'erase all' },
                { opcode: 'pen_stamp', blockType: 'command', text: 'stamp' },
                { opcode: 'pen_penDown', blockType: 'command', text: 'pen down' },
                { opcode: 'pen_penUp', blockType: 'command', text: 'pen up' },
                { opcode: 'pen_setPenColorToColor', blockType: 'command', text: 'set pen color to [COLOR]', arguments: { COLOR: { type: 'colour', defaultValue: '#ff0000' } } },
                { opcode: 'pen_setPenColorToNumber', blockType: 'command', text: 'set pen color to [COLOR]', arguments: { COLOR: { type: 'number', defaultValue: 50 } } },
                { opcode: 'pen_changePenSizeBy', blockType: 'command', text: 'change pen size by [SIZE]', arguments: { SIZE: { type: 'number', defaultValue: 1 } } },
                { opcode: 'pen_setPenSizeTo', blockType: 'command', text: 'set pen size to [SIZE]', arguments: { SIZE: { type: 'number', defaultValue: 1 } } },
            ]
        };
    }

    pen_clear() { (window as any).runtime?.pen?.eraseAll(); }
    pen_stamp() { (window as any).runtime?.pen?.stamp(); }
    pen_penDown() { (window as any).runtime?.pen?.penDown(); }
    pen_penUp() { (window as any).runtime?.pen?.penUp(); }
    pen_setPenColorToColor(color: string) { (window as any).runtime?.pen?.setColor(color); }
    pen_setPenColorToNumber(color: number) { (window as any).runtime?.pen?.setColorByNumber(color); }
    pen_changePenSizeBy(size: number) { (window as any).runtime?.pen?.changeSize(size); }
    pen_setPenSizeTo(size: number) { (window as any).runtime?.pen?.setSize(size); }
}

export const penExtension = new PenExtension();
