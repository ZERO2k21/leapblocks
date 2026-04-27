/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export default function defineLeapBlocks(Blockly, javascriptGenerator) {
    if (!Blockly || !javascriptGenerator) return;

    // Helper to get target code
    const getTarget = () => 'window.activeSpriteId || "robot_default"';
    // Helper to inject wait and check execution state for immediate stop
    const wait = () => 'if(!window.isActive()) return;\nawait window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\nif(window.checkPause) await window.checkPause();\nif(!window.isActive()) return;\n';
    const yieldLoop = () => 'if(!window.isActive()) return;\nawait window.wait(0.01);\nif(window.checkPause) await window.checkPause();\n'; // Faster wait for loop cycles
    const GRID_DEFAULT_X = 10;
    const GRID_DEFAULT_Y = 8;
    const DIRECTION_SYMBOLS = {
        UP: "↑",
        DOWN: "↓",
        LEFT: "←",
        RIGHT: "→",
        CENTER: "•"
    };
    const formatGridLabel = (x, y) => `${x},${y}`;
    const normalizeDirection = (direction) => DIRECTION_SYMBOLS[direction] ? direction : "RIGHT";

    // --- MOTION (Blue #4C97FF) ---

    // Helper for Junior Blocks (Horizontal Layout: Icon Left, Dropdown Right)
    function juniorBlockBase(block, iconChar, fieldName, options) {
        // Single Row: Icon + Dropdown
        block.appendDummyInput()
            .appendField(new Blockly.FieldLabel(iconChar, "junior-block-icon"))
            .appendField(new Blockly.FieldDropdown(options), fieldName);

        block.setPreviousStatement(true);
        block.setNextStatement(true);
        block.setColour("#4C97FF"); // PictoBlox Blue
        block.setTooltip("");
    }

    const MOVE_OPTIONS = [["1", "1"], ["2", "2"], ["3", "3"], ["5", "5"], ["10", "10"], ["20", "20"]];
    const TURN_OPTIONS = [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["6", "6"], ["12", "12"]];

    Blockly.Blocks['move_right'] = {
        init: function () {
            juniorBlockBase(this, "→", "STEPS", MOVE_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['move_right'] = (block) => {
        const steps = block.getFieldValue("STEPS");
        return `moveRelative(${getTarget()}, "RIGHT", ${steps});\n${wait()}`;
    };

    Blockly.Blocks['move_left'] = {
        init: function () {
            juniorBlockBase(this, "←", "STEPS", MOVE_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['move_left'] = (block) => {
        const steps = block.getFieldValue("STEPS");
        return `moveRelative(${getTarget()}, "LEFT", ${steps});\n${wait()}`;
    };

    Blockly.Blocks['move_up'] = {
        init: function () {
            juniorBlockBase(this, "↑", "STEPS", MOVE_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['move_up'] = (block) => {
        const steps = block.getFieldValue("STEPS");
        return `moveRelative(${getTarget()}, "UP", ${steps});\n${wait()}`;
    };

    Blockly.Blocks['move_down'] = {
        init: function () {
            juniorBlockBase(this, "↓", "STEPS", MOVE_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['move_down'] = (block) => {
        const steps = block.getFieldValue("STEPS");
        return `moveRelative(${getTarget()}, "DOWN", ${steps});\n${wait()}`;
    };

    Blockly.Blocks['turn_right'] = {
        init: function () {
            juniorBlockBase(this, "↻", "TIMES", TURN_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['turn_right'] = (block) => {
        const times = block.getFieldValue("TIMES");
        return `turnRight(${getTarget()}, ${times});\n${wait()}`;
    };

    Blockly.Blocks['turn_left'] = {
        init: function () {
            juniorBlockBase(this, "↺", "TIMES", TURN_OPTIONS);
        }
    };
    javascriptGenerator.forBlock['turn_left'] = (block) => {
        const times = block.getFieldValue("TIMES");
        return `turnLeft(${getTarget()}, ${times});\n${wait()}`;
    };

    Blockly.Blocks['jump'] = {
        init: function () {
            juniorBlockBase(this, "⤴", "TIMES", [["1", "1"], ["2", "2"], ["3", "3"]]);
        }
    };
    javascriptGenerator.forBlock['jump'] = (block) => {
        const times = block.getFieldValue("TIMES");
        return `jump(${getTarget()}, ${times});\n${wait()}`;
    };

    Blockly.Blocks['run'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("→", "junior-icon")).appendField("Run"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#4C97FF"); } };
    javascriptGenerator.forBlock['run'] = () => `run(${getTarget()});\n${wait()}`;

    Blockly.Blocks['findout'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧭", "junior-icon")).appendField("Findout"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#4C97FF"); } };
    javascriptGenerator.forBlock['findout'] = () => `findout(${getTarget()});\n${wait()}`;

    Blockly.Blocks['go_to_location'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📍", "junior-icon-large"))
                .appendField("Go to")
                .appendField(new Blockly.FieldLabel(formatGridLabel(GRID_DEFAULT_X, GRID_DEFAULT_Y), "junior-inline-pill"), "POSITION");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#4C97FF"); // Motion Color

            this.posX = GRID_DEFAULT_X;
            this.posY = GRID_DEFAULT_Y;
            this.setGridPosition = (x, y) => {
                this.posX = Number.isFinite(Number(x)) ? Number(x) : GRID_DEFAULT_X;
                this.posY = Number.isFinite(Number(y)) ? Number(y) : GRID_DEFAULT_Y;
                this.setFieldValue(formatGridLabel(this.posX, this.posY), "POSITION");
            };
            this.saveExtraState = () => ({
                posX: this.posX,
                posY: this.posY
            });
            this.loadExtraState = (state) => {
                this.setGridPosition(state?.posX ?? GRID_DEFAULT_X, state?.posY ?? GRID_DEFAULT_Y);
            };
        }
    };
    javascriptGenerator.forBlock['go_to_location'] = (block) => {
        // Use stored positions or default
        const x = Number.isFinite(Number(block.posX)) ? Number(block.posX) : GRID_DEFAULT_X;
        const y = Number.isFinite(Number(block.posY)) ? Number(block.posY) : GRID_DEFAULT_Y;
        return `goToLocation(${x}, ${y});\n${wait()}`;
    };

    Blockly.Blocks["move_relative"] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📍", "junior-icon-large"))
                .appendField("Move")
                .appendField(new Blockly.FieldLabel(DIRECTION_SYMBOLS.RIGHT, "junior-inline-pill"), "DIR_DISPLAY");

            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#4C97FF");

            this.direction = "RIGHT";
            this.setDirection = (direction) => {
                this.direction = normalizeDirection(direction);
                this.setFieldValue(DIRECTION_SYMBOLS[this.direction], "DIR_DISPLAY");
            };
            this.getDirection = () => normalizeDirection(this.direction);
            this.saveExtraState = () => ({
                direction: this.direction
            });
            this.loadExtraState = (state) => {
                this.setDirection(state?.direction ?? "RIGHT");
            };
        },
    };

    javascriptGenerator.forBlock["move_relative"] = function (block) {
        const direction = block.getDirection ? block.getDirection() : normalizeDirection(block.direction);
        return `moveRelative(${getTarget()}, "${direction}");\n${wait()}`;
    };


    // --- LOOKS (Purple 260 -> #9966FF) ---
    const EMOJI_OPTIONS = [["🙂", "🙂"], ["👋", "👋"], ["❤️", "❤️"], ["🎉", "🎉"], ["⭐", "⭐"], ["🍎", "🍎"], ["🐶", "🐶"]];

    Blockly.Blocks['looks_say'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("💬", "junior-icon"))
                .appendField("Say")
                .appendField(new Blockly.FieldDropdown(EMOJI_OPTIONS), "MSG");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_say'] = (block) => {
        const msg = block.getFieldValue('MSG') || block.getFieldValue('MESSAGE') || "";
        return `say(${getTarget()}, ${JSON.stringify(msg)});\n${wait()}`;
    };

    // ... (Show/Hide/Grow/Shrink remain strict stacks)

    Blockly.Blocks['looks_show'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("👁", "junior-icon")).appendField("Visible"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_show'] = () => `setVisible(${getTarget()}, true);\n${wait()}`;

    Blockly.Blocks['looks_hide'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🙈", "junior-icon")).appendField("Hide"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_hide'] = () => `setVisible(${getTarget()}, false);\n${wait()}`;

    Blockly.Blocks['looks_grow'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("⊕", "junior-icon")).appendField("Enlarge"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_grow'] = () => `changeSize(${getTarget()}, 10);\n${wait()}`;

    Blockly.Blocks['looks_shrink'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("⊖", "junior-icon")).appendField("Zoomout"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_shrink'] = () => `changeSize(${getTarget()}, -10);\n${wait()}`;

    Blockly.Blocks['looks_turn_back'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↩", "junior-icon")).appendField("Turn Back"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_turn_back'] = () => `turnLeft(${getTarget()}); turnLeft(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_walk'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("→", "junior-icon")).appendField("Walk"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_walk'] = () => `moveForward(${getTarget()});\n${wait()}`;

    Blockly.Blocks['looks_call'] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.sprites.length > 0) {
                        return data.sprites.map(sprite => [sprite.name, sprite.name]);
                    }
                }
                return [["Teddy", "Teddy"]];
            });

            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📢", "junior-icon"))
                .appendField("Call")
                .appendField(dynamicDropdown, "NAME");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_call'] = (block) => `say(${getTarget()}, "Hello ${block.getFieldValue('NAME')}!");\n${wait()}`;

    Blockly.Blocks['looks_symmetry'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧭", "junior-icon")).appendField("Symmetry"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#9966FF"); } };
    javascriptGenerator.forBlock['looks_symmetry'] = () => `symmetry(${getTarget()});\n${wait()}`;


    // --- CONTROL (Orange 30 -> #FFAB19) ---
    Blockly.Blocks['control_forever'] = {
        init: function () {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔄", "junior-icon")).appendField("Forever");
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    // REAL INFINITE LOOP - Checks window.isActive() to allow Stop Button to break it
    javascriptGenerator.forBlock['control_forever'] = (b) => {
        const branch = javascriptGenerator.statementToCode(b, 'DO');
        return `while(window.isActive()) {\n${branch}\n${yieldLoop()}}\n`;
    };

    Blockly.Blocks['control_repeat'] = {
        init: function () {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔁", "junior-icon")).appendField("Repeat 4");
            this.appendStatementInput("DO").setCheck(null);
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19");
        }
    };
    // Safe Repeat - Also checks isActive so it stops immediately
    javascriptGenerator.forBlock['control_repeat'] = (b) => {
        const branch = javascriptGenerator.statementToCode(b, 'DO');
        return `for(let i=0; i<4 && window.isActive(); i++){\n${branch}\n}\n`;
    };

    Blockly.Blocks['control_turn'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↻", "junior-icon")).appendField("Turn"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19"); } };
    javascriptGenerator.forBlock['control_turn'] = () => `turnRight(${getTarget()});\n${wait()}`;

    Blockly.Blocks['control_reverse'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↺", "junior-icon")).appendField("Reverse"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19"); } };
    javascriptGenerator.forBlock['control_reverse'] = () => `turnLeft(${getTarget()});\n${wait()}`;

    Blockly.Blocks['control_stop'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✋", "junior-icon")).appendField("Stop"); this.setPreviousStatement(true); this.setColour("#FFAB19"); } };
    javascriptGenerator.forBlock['control_stop'] = () => 'if(window.pauseExecution) window.pauseExecution();\nif(window.checkPause) await window.checkPause();\n';

    Blockly.Blocks['control_scene'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🚩", "junior-icon")).appendField("Change Scene"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFAB19"); } };
    javascriptGenerator.forBlock['control_scene'] = () => `changeScene();\n${wait()}`;


    // --- EVENTS (Yellow 60 -> #FFBF00) ---
    Blockly.Blocks['event_flag'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🚩", "junior-icon-large"))
                .appendField("Start"); // Optional: Keep short label "Start" or remove entirely if icon is enough.
            this.setNextStatement(true);
            this.setColour("#FFBF00");
            this.setDeletable(true);
        },
        customContextMenu: function (options) {
            // Add Delete option
            options.push({
                text: "Delete Block",
                enabled: true,
                callback: () => {
                    this.dispose(true);
                }
            });
            // Add Duplicate option
            options.push({
                text: "Duplicate",
                enabled: true,
                callback: () => {
                    const blockXML = Blockly.Xml.blockToDom(this);
                    const newBlock = Blockly.Xml.domToBlock(blockXML, this.workspace);
                    // Position the duplicated block slightly offset
                    const xy = this.getRelativeToSurfaceXY();
                    newBlock.moveBy(20, 20);
                }
            });
        }
    };
    javascriptGenerator.forBlock['event_flag'] = () => '// On Flag\n';

    Blockly.Blocks['event_up'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↑", "junior-icon")).appendField("Event Up"); this.setNextStatement(true); this.setColour("#FFBF00"); } };
    javascriptGenerator.forBlock['event_up'] = () => '// On Up\n';

    Blockly.Blocks['event_down'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("↓", "junior-icon")).appendField("Event Down"); this.setNextStatement(true); this.setColour("#FFBF00"); } };
    javascriptGenerator.forBlock['event_down'] = () => '// On Down\n';

    Blockly.Blocks['event_mail_give'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("📧", "junior-icon")).appendField("Mail Give"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#FFBF00"); } };
    javascriptGenerator.forBlock['event_mail_give'] = () => `showFeedback("Mail Sent!");\n${wait()}`;

    Blockly.Blocks['event_mail_get'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("📧", "junior-icon")).appendField("Mail Get"); this.setNextStatement(true); this.setColour("#FFBF00"); } };
    javascriptGenerator.forBlock['event_mail_get'] = () => '// On Mail\n';

    Blockly.Blocks['event_press'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✋", "junior-icon")).appendField("Press"); this.setNextStatement(true); this.setColour("#FFBF00"); } };
    javascriptGenerator.forBlock['event_press'] = () => '// On Press\n';


    // --- PEN (Green 120 -> #0FBD8C) ---
    Blockly.Blocks['pen_down'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✏️", "junior-icon")).appendField("Writing Down"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_down'] = () => `penDown(${getTarget()});\n${wait()}`;

    Blockly.Blocks['pen_up'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✒️", "junior-icon")).appendField("Writing Up"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_up'] = () => `penUp(${getTarget()});\n${wait()}`;

    Blockly.Blocks['pen_brush'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✏️", "junior-icon")).appendField("Brush"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_brush'] = () => `showFeedback("Brush Mode");\n${wait()}`;

    Blockly.Blocks['pen_eraser'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧹", "junior-icon")).appendField("Eraser"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_eraser'] = () => `if(window.clearPen) window.clearPen();\n${wait()}`;

    Blockly.Blocks['pen_graph'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🧭", "junior-icon")).appendField("Graph Draw"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_graph'] = () => `showFeedback("Graph Mode");\n${wait()}`;

    Blockly.Blocks['pen_adjust'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("✏️", "junior-icon")).appendField("Adjust Pen"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#0FBD8C"); } };
    javascriptGenerator.forBlock['pen_adjust'] = () => `showFeedback("Pen Adjusted");\n${wait()}`;


    // --- SOUND (Pink 330 -> #CF63CF) ---
    Blockly.Blocks['sound_record'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("📢", "junior-icon")).appendField("Voice Record"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_record'] = () => `showFeedback("Recording...");\n${wait()}`;

    Blockly.Blocks['sound_vol'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Volume Adjust"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_vol'] = () => `showFeedback("Volume Changed");\n${wait()}`;

    Blockly.Blocks['sound_animal'] = {
        init: function () {
            this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Sound of").appendField(new Blockly.FieldDropdown([["Bear", "grunt"], ["Dog", "bark"], ["Cat", "meow"], ["Robot", "robot"]]), "VAL");
            this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock['sound_animal'] = (b) => `playSound("${b.getFieldValue('VAL')}");\n${wait()}`;

    Blockly.Blocks['sound_music'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Play Note"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_music'] = () => `playNote();\n${wait()}`;

    Blockly.Blocks['sound_mute'] = { init: function () { this.appendDummyInput().appendField(new Blockly.FieldLabel("🔊", "junior-icon")).appendField("Mute"); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour("#CF63CF"); } };
    javascriptGenerator.forBlock['sound_mute'] = () => `showFeedback("Muted");\n${wait()}`;

    // ===========================================
    // NEW PICTOBLOX BLOCKS
    // ===========================================

    // --- MOTION: Go to Random Position (Zone-Constrained) ---

    // STEP A: Custom field — renders the 3×3 zone picker popup
    class FieldDirectionPicker extends Blockly.Field {
        constructor(value) {
            super(value || 'CENTER');
            this.SERIALIZABLE = true;
            this.CURSOR = 'pointer';
        }

        static fromJson(o) { return new FieldDirectionPicker(o['value']); }

        // Builds the SVG icon for each popup cell
        _svg(zone) {
            const s = 48, c = 24, bar = 3.5, arrH = 8;
            const pin =
                `<circle cx="${c}" cy="19" r="8" fill="white" opacity=".88"/>` +
                `<path d="M24 34 Q19 27 16.5 21 A8 8 0 1 1 31.5 21 Q29 27 24 34Z" fill="white" opacity=".88"/>` +
                `<circle cx="${c}" cy="19" r="3.4" fill="#4a90d9"/>`;
            const w = (b) =>
                `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;

            if (zone === 'TOP')
                return w(`<rect x="8" y="7" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>${pin}`);
            if (zone === 'BOTTOM')
                return w(`${pin}<rect x="8" y="38" width="32" height="${bar}" rx="1.5" fill="white" opacity=".88"/>`);
            if (zone === 'LEFT')
                return w(
                    `<polygon points="5,${c} 16,${c - arrH} 16,${c + arrH}" fill="white" opacity=".88"/>` +
                    `<rect x="16" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/>` +
                    pin
                );
            if (zone === 'RIGHT')
                return w(
                    pin +
                    `<rect x="25" y="${c - bar / 2}" width="7" height="${bar}" fill="white" opacity=".88"/>` +
                    `<polygon points="43,${c} 32,${c - arrH} 32,${c + arrH}" fill="white" opacity=".88"/>`
                );
            return w(pin); // CENTER — plain pin
        }

        getText_() {
            return { TOP: '↑', LEFT: '←', CENTER: '?', RIGHT: '→', BOTTOM: '↓' }[this.value_] || '?';
        }

        showEditor_() {
            const self = this;
            const grid = document.createElement('div');
            grid.style.cssText =
                'display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(3,60px);' +
                'gap:5px;padding:10px;background:#3a82c4;border-radius:14px;' +
                'box-shadow:0 8px 28px rgba(0,0,0,.35)';

            ['', 'TOP', '', 'LEFT', 'CENTER', 'RIGHT', '', 'BOTTOM', ''].forEach(function (zone) {
                const cell = document.createElement('div');
                if (!zone) {
                    cell.style.cssText = 'width:60px;height:60px';
                    grid.appendChild(cell);
                    return;
                }

                const selected = zone === self.value_;
                cell.style.cssText =
                    'width:60px;height:60px;border-radius:11px;display:flex;align-items:center;' +
                    'justify-content:center;cursor:pointer;overflow:hidden;transition:background .12s,transform .1s;' +
                    'background:' + (selected ? '#1a5899' : '#4a8fd6') + ';' +
                    'border:2.5px solid ' + (selected ? '#fff' : 'rgba(255,255,255,.22)');

                cell.innerHTML = self._svg(zone);

                cell.onmouseenter = function () {
                    cell.style.background = '#2570bb';
                    cell.style.transform = 'scale(1.08)';
                };
                cell.onmouseleave = function () {
                    cell.style.background = zone === self.value_ ? '#1a5899' : '#4a8fd6';
                    cell.style.transform = 'scale(1)';
                };
                cell.onmousedown = function (e) {
                    e.preventDefault();
                    const old = self.value_;
                    self.setValue(zone);
                    Blockly.DropDownDiv.hideWithoutAnimation();
                    if (self.sourceBlock_) {
                        Blockly.Events.fire(
                            new Blockly.Events.BlockChange(
                                self.sourceBlock_, 'field', self.name, old, zone
                            )
                        );
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

    // STEP B: Block definition — replaces the old stub
    Blockly.Blocks['go_random'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🎲", "junior-block-icon"))
                .appendField(new FieldDirectionPicker('CENTER'), 'DIRECTION');
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#4C97FF");
            this.setTooltip("Move sprite randomly within selected zone");
        }
    };

    // STEP C: Generator — emits zone bounds to runtime
    javascriptGenerator.forBlock['go_random'] = (block) => {
        const dir = block.getFieldValue('DIRECTION') || 'CENTER';
        // Grid bounds: x 1-20, y 1-15 (y=15 is topmost, y=1 is bottommost)
        const zones = {
            TOP: [1, 20, 11, 15],
            LEFT: [1, 6, 1, 15],
            CENTER: [7, 14, 5, 11],
            RIGHT: [15, 20, 1, 15],
            BOTTOM: [1, 20, 1, 5],
        };
        const [xMin, xMax, yMin, yMax] = zones[dir];
        return (
            `if(!window.isActive()) return;\n` +
            `window.moveRandom(${getTarget()}, ${xMin}, ${xMax}, ${yMin}, ${yMax});\n` +
            `${wait()}`
        );
    };

    // --- MOTION: Change Speed ---
    Blockly.Blocks['change_speed'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("⏱️", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Slow", "slow"], ["Normal", "normal"], ["Fast", "fast"]]), "SPEED");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#4C97FF");
        }
    };
    javascriptGenerator.forBlock['change_speed'] = (block) => {
        const speed = block.getFieldValue("SPEED");
        return `setSpeed("${speed}");\n${wait()}`;
    };

    // --- CONTROL: Wait Block ---
    Blockly.Blocks['control_wait'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("⏳", "junior-block-icon"))
                .appendField(new Blockly.FieldNumber(1, 0.1), "SECONDS")
                .appendField("sec");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#FFAB19");
        }
    };
    javascriptGenerator.forBlock['control_wait'] = (block) => {
        const seconds = block.getFieldValue("SECONDS");
        return `await window.wait(${seconds});\nif(window.checkPause) await window.checkPause();\nif(!window.isActive()) return;\n`;
    };

    // --- LOOKS: Reset Size ---
    Blockly.Blocks['looks_reset_size'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("↩️", "junior-block-icon"))
                .appendField("Reset Size");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_reset_size'] = () => `resetSize(${getTarget()});\n${wait()}`;

    // --- LOOKS: Next Costume ---
    Blockly.Blocks['looks_next_costume'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("👔", "junior-block-icon"))
                .appendField("Next Costume");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_next_costume'] = () => `nextCostume(${getTarget()});\n${wait()}`;

    // --- LOOKS: Change Costume ---
    Blockly.Blocks['looks_change_costume'] = {
        init: function () {
            const dynamicDropdown = new Blockly.FieldDropdown(() => {
                if (window.getLeapProjectData) {
                    const data = window.getLeapProjectData();
                    if (data && data.sprites && data.activeSpriteId) {
                        const sprite = data.sprites.find(s => s.id === data.activeSpriteId);
                        if (sprite && sprite.costumes) {
                            return Object.keys(sprite.costumes).map(key => [
                                key.charAt(0).toUpperCase() + key.slice(1),
                                key
                            ]);
                        }
                    }
                }
                return [["Default", "default"]];
            });

            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🎭", "junior-block-icon"))
                .appendField(dynamicDropdown, "COSTUME");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_change_costume'] = (block) => {
        const costume = block.getFieldValue("COSTUME");
        return `changeCostume(${getTarget()}, "${costume}");\n${wait()}`;
    };

    // --- LOOKS: Mirror/Flip ---
    Blockly.Blocks['looks_mirror'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("↔️", "junior-block-icon"))
                .appendField("Mirror");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#9966FF");
        }
    };
    javascriptGenerator.forBlock['looks_mirror'] = () => `mirrorSprite(${getTarget()});\n${wait()}`;

    // --- PEN: Stamp ---
    Blockly.Blocks['pen_stamp'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🖼️", "junior-block-icon"))
                .appendField("Stamp");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_stamp'] = () => `stampSprite(${getTarget()});\n${wait()}`;

    // --- PEN: Set Pen Color ---
    Blockly.Blocks['pen_set_color'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🎨", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Red", "#FF0000"], ["Blue", "#0000FF"], ["Green", "#00FF00"], ["Yellow", "#FFFF00"], ["Purple", "#9966FF"]]), "COLOR");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_set_color'] = (block) => {
        const color = block.getFieldValue("COLOR");
        return `setPenColor("${color}");\n${wait()}`;
    };

    // --- PEN: Set Pen Size ---
    Blockly.Blocks['pen_set_size'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("📏", "junior-block-icon"))
                .appendField(new Blockly.FieldDropdown([["Thin", "2"], ["Normal", "5"], ["Thick", "10"]]), "SIZE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#0FBD8C");
        }
    };
    javascriptGenerator.forBlock['pen_set_size'] = (block) => {
        const size = block.getFieldValue("SIZE");
        return `setPenSize(${size});\n${wait()}`;
    };

    // --- SOUND: Stop All Sounds ---
    Blockly.Blocks['sound_stop'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("🔇", "junior-block-icon"))
                .appendField("Stop Sound");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#CF63CF");
        }
    };
    javascriptGenerator.forBlock['sound_stop'] = () => `stopAllSounds();\n${wait()}`;

    // ===========================================
    // INTER-SPRITE COMMUNICATION (Broadcast)
    // ===========================================

    // --- EVENTS: Send Message (Broadcast) ---
    const MESSAGE_OPTIONS = [["go", "go"], ["hello", "hello"], ["start", "start"], ["done", "done"], ["win", "win"]];

    Blockly.Blocks['broadcast_message'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("\u{1F4E1}", "junior-block-icon"))
                .appendField("Send Message")
                .appendField(new Blockly.FieldDropdown(MESSAGE_OPTIONS), "MESSAGE");
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setColour("#FFBF00");
        }
    };
    javascriptGenerator.forBlock['broadcast_message'] = (block) => {
        const msg = block.getFieldValue("MESSAGE");
        return `window.broadcastMessage("${msg}");\n${wait()}`;
    };

    // --- EVENTS: When I Receive Message (Hat Block) ---
    Blockly.Blocks['when_receive_message'] = {
        init: function () {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel("\u{1F4E8}", "junior-icon-large"))
                .appendField("When I Receive")
                .appendField(new Blockly.FieldDropdown(MESSAGE_OPTIONS), "MESSAGE");
            this.setNextStatement(true);
            this.setColour("#FFBF00");
            this.setDeletable(true);
        }
    };
    javascriptGenerator.forBlock['when_receive_message'] = () => '// On Receive Message\n';
}

