export const GRID_DEFAULT_X = 10;
export const GRID_DEFAULT_Y = 8;
export const MOVE_OPTIONS = [["1", "1"], ["2", "2"], ["3", "3"], ["5", "5"], ["10", "10"], ["20", "20"]];
export const TURN_OPTIONS = [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"], ["12", "12"]];
export const EMOJI_OPTIONS = [["🙂", "🙂"], ["👋", "👋"], ["❤️", "❤️"], ["🎉", "🎉"], ["⭐", "⭐"], ["🍎", "🍎"], ["🐶", "🐶"]];
export const MESSAGE_OPTIONS = [["go", "go"], ["hello", "hello"], ["start", "start"], ["done", "done"], ["win", "win"]];

export const DIRECTION_SYMBOLS = {
    UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→", CENTER: "•"
};

export const getTarget = () => 'window.activeSpriteId || "robot_default"';
export const wait = () => 'if(!window.isActive()) return;\nawait window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\nif(window.checkPause) await window.checkPause();\nif(!window.isActive()) return;\n';
export const yieldLoop = () => 'if(!window.isActive()) return;\nawait window.wait(0.01);\nif(window.checkPause) await window.checkPause();\n';
export const formatGridLabel = (x, y) => `${x},${y}`;
export const normalizeDirection = (direction) => DIRECTION_SYMBOLS[direction] ? direction : "RIGHT";

export function juniorBlockBase(Blockly, block, iconChar, fieldName, options) {
    block.appendDummyInput()
        .appendField(new Blockly.FieldLabel(iconChar, "junior-block-icon"))
        .appendField(new Blockly.FieldDropdown(options), fieldName);
    block.setPreviousStatement(true);
    block.setNextStatement(true);
    block.setColour("#4C97FF");
    block.setTooltip("");
}

let FieldDirectionPickerClass = null;

export function getFieldDirectionPickerClass() {
    return FieldDirectionPickerClass;
}

export function registerFieldDirectionPicker(Blockly) {
    class FieldDirectionPicker extends Blockly.Field {
        constructor(value) {
            super(value || 'CENTER');
            this.SERIALIZABLE = true;
            this.CURSOR = 'pointer';
        }

        static fromJson(o) { return new FieldDirectionPicker(o['value']); }

        _svg(zone) {
            const s = 48, c = 24, bar = 3.5, arrH = 8;
            const pin = `<circle cx="${c}" cy="19" r="8" fill="white" opacity=".88"/><path d="M24 34 Q19 27 16.5 21 A8 8 0 1 1 31.5 21 Q29 27 24 34Z" fill="white" opacity=".88"/><circle cx="${c}" cy="19" r="3.4" fill="#4a90d9"/>`;
            const w = (b) => `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
            if (zone === 'TOP') return w(`<rect x="8" y="7" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>${pin}`);
            if (zone === 'BOTTOM') return w(`${pin}<rect x="8" y="38" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>`);
            if (zone === 'LEFT') return w(`<polygon points="5,${c} 16,${c - arrH} 16,${c + arrH}" fill="white" opacity=".88"/><rect x="16" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/>${pin}`);
            if (zone === 'RIGHT') return w(`${pin}<rect x="25" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/><polygon points="43,${c} 32,${c - arrH} 32,${c + arrH}" fill="white" opacity=".88"/>`);
            return w(pin);
        }

        getText_() {
            return { TOP: '↑', LEFT: '←', CENTER: '?', RIGHT: '→', BOTTOM: '↓' }[this.value_] || '?';
        }

        showEditor_() {
            const self = this;
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(3,60px);gap:5px;padding:10px;background:#3a82c4;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.35)';
            ['', 'TOP', '', 'LEFT', 'CENTER', 'RIGHT', '', 'BOTTOM', ''].forEach(function (zone) {
                const cell = document.createElement('div');
                if (!zone) { cell.style.cssText = 'width:60px;height:60px'; grid.appendChild(cell); return; }
                const selected = zone === self.value_;
                cell.style.cssText = 'width:60px;height:60px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:background .12s,transform .1s;background:' + (selected ? '#1a5899' : '#4a8fd6') + ';border:2.5px solid ' + (selected ? '#fff' : 'rgba(255,255,255,.22)');
                cell.innerHTML = self._svg(zone);
                cell.onmouseenter = function () { cell.style.background = '#2570bb'; cell.style.transform = 'scale(1.08)'; };
                cell.onmouseleave = function () { cell.style.background = zone === self.value_ ? '#1a5899' : '#4a8fd6'; cell.style.transform = 'scale(1)'; };
                cell.onmousedown = function (e) {
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

        getValue() { return this.value_ || 'CENTER'; }
        setValue(v) { if (['TOP', 'LEFT', 'CENTER', 'RIGHT', 'BOTTOM'].includes(v)) super.setValue(v); }
        saveState() { return this.getValue(); }
        loadState(s) { this.setValue(s); }
    }
    Blockly.fieldRegistry.register('field_direction_picker', FieldDirectionPicker);
    FieldDirectionPickerClass = FieldDirectionPicker;
}
