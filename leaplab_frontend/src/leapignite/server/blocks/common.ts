export const GRID_DEFAULT_X: number = 10;
export const GRID_DEFAULT_Y: number = 8;
export const MOVE_OPTIONS: [string, string][] = [["1", "1"], ["2", "2"], ["3", "3"], ["5", "5"], ["10", "10"], ["20", "20"]];
export const TURN_OPTIONS: [string, string][] = [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"], ["12", "12"]];
export const EMOJI_OPTIONS: [string, string][] = [["🙂", "🙂"], ["👋", "👋"], ["❤️", "❤️"], ["🎉", "🎉"], ["⭐", "⭐"], ["🍎", "🍎"], ["🐶", "🐶"]];
export const MESSAGE_OPTIONS: [string, string][] = [["go", "go"], ["hello", "hello"], ["start", "start"], ["done", "done"], ["win", "win"]];

export const DIRECTION_SYMBOLS: Record<string, string> = {
    UP: "\u2191", DOWN: "\u2193", LEFT: "\u2190", RIGHT: "\u2192", CENTER: "\u2022"
};

export const getTarget = (): string => 'window.activeSpriteId || "robot_default"';
export const wait = (): string => 'if(!window.isActive()) return;\nawait window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\nif(window.checkPause) await window.checkPause();\nif(!window.isActive()) return;\n';
export const yieldLoop = (): string => 'if(!window.isActive()) return;\nawait window.wait(0.01);\nif(window.checkPause) await window.checkPause();\n';
export const formatGridLabel = (x: number, y: number): string => `${x},${y}`;
export const normalizeDirection = (direction: string): string => DIRECTION_SYMBOLS[direction] ? direction : "RIGHT";

export function juniorBlockBase(Blockly: any, block: any, iconChar: string, fieldName: string, options: [string, string][]): void {
    block.appendDummyInput()
        .appendField(new Blockly.FieldLabel(iconChar, "junior-block-icon"))
        .appendField(new Blockly.FieldDropdown(options), fieldName);
    block.setPreviousStatement(true);
    block.setNextStatement(true);
    block.setColour("#4C97FF");
    block.setTooltip("");
}

let FieldDirectionPickerClass: any = null;

export function getFieldDirectionPickerClass(): any {
    return FieldDirectionPickerClass;
}

export function registerFieldDirectionPicker(Blockly: any): void {
    class FieldDirectionPicker extends Blockly.Field {
        SERIALIZABLE: boolean;
        CURSOR: string;

        constructor(value?: string) {
            super(value || 'CENTER');
            this.SERIALIZABLE = true;
            this.CURSOR = 'pointer';
        }

        static fromJson(o: { value?: string }): FieldDirectionPicker {
            return new FieldDirectionPicker(o['value']);
        }

        _svg(zone: string): string {
            const s = 48, c = 24, bar = 3.5, arrH = 8;
            const pin = `<circle cx="${c}" cy="19" r="8" fill="white" opacity=".88"/><path d="M24 34 Q19 27 16.5 21 A8 8 0 1 1 31.5 21 Q29 27 24 34Z" fill="white" opacity=".88"/><circle cx="${c}" cy="19" r="3.4" fill="#4a90d9"/>`;
            const w = (b: string): string => `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
            if (zone === 'TOP') return w(`<rect x="8" y="7" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>${pin}`);
            if (zone === 'BOTTOM') return w(`${pin}<rect x="8" y="38" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>`);
            if (zone === 'LEFT') return w(`<polygon points="5,${c} 16,${c - arrH} 16,${c + arrH}" fill="white" opacity=".88"/><rect x="16" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/>${pin}`);
            if (zone === 'RIGHT') return w(`${pin}<rect x="25" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/><polygon points="43,${c} 32,${c - arrH} 32,${c + arrH}" fill="white" opacity=".88"/>`);
            return w(pin);
        }

        getText_(): string {
            const map: Record<string, string> = { TOP: '\u2191', LEFT: '\u2190', CENTER: '?', RIGHT: '\u2192', BOTTOM: '\u2193' };
            return map[this.value_] || '?';
        }

        showEditor_(): void {
            const self = this;
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(3,60px);gap:5px;padding:10px;background:#3a82c4;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.35)';
            ['', 'TOP', '', 'LEFT', 'CENTER', 'RIGHT', '', 'BOTTOM', ''].forEach(function (zone: string) {
                const cell = document.createElement('div');
                if (!zone) { cell.style.cssText = 'width:60px;height:60px'; grid.appendChild(cell); return; }
                const selected = zone === self.value_;
                cell.style.cssText = 'width:60px;height:60px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:background .12s,transform .1s;background:' + (selected ? '#1a5899' : '#4a8fd6') + ';border:2.5px solid ' + (selected ? '#fff' : 'rgba(255,255,255,.22)');
                cell.innerHTML = self._svg(zone);
                cell.onmouseenter = function () { cell.style.background = '#2570bb'; cell.style.transform = 'scale(1.08)'; };
                cell.onmouseleave = function () { cell.style.background = zone === self.value_ ? '#1a5899' : '#4a8fd6'; cell.style.transform = 'scale(1)'; };
                cell.onmousedown = function (e: MouseEvent) {
                    e.preventDefault();
                    const old = self.value_;
                    self.setValue(zone);
                    Blockly.DropDownDiv.hideWithoutAnimation();
                    if (self.sourceBlock_) {
                        Blockly.Events.fire(new Blockly.Events.BlockChange(self.sourceBlock_, 'field', self.name, old, zone));
                    }
                };
                grid.appendChild(cell);
            });
            Blockly.DropDownDiv.getContentDiv().appendChild(grid);
            Blockly.DropDownDiv.setColour('#3a82c4', '#2a6aad');
            Blockly.DropDownDiv.showPositionedByField(this, function () { });
        }

        getValue(): string { return this.value_ || 'CENTER'; }
        setValue(v: string): void { if (['TOP', 'LEFT', 'CENTER', 'RIGHT', 'BOTTOM'].includes(v)) super.setValue(v); }
        saveState(): string { return this.getValue(); }
        loadState(s: string): void { this.setValue(s); }
    }
    Blockly.fieldRegistry.register('field_direction_picker', FieldDirectionPicker);
    FieldDirectionPickerClass = FieldDirectionPicker;
}
