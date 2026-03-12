/**
 * SkulptEngine – in-browser Python execution.
 * Skulpt is imported directly from the npm package (bundled by webpack).
 * No CDN or dynamic script tags needed.
 */

// Import Skulpt from the npm package — webpack bundles this directly.
// skulpt/main.js does: require('./dist/skulpt.min.js') + require('./dist/skulpt-stdlib.js')
// and then: module.exports = Sk;
let Sk;
try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    Sk = require('skulpt');
    // Skulpt also attaches to window.Sk, but let's keep a direct reference
    if (!Sk) Sk = window.Sk;
} catch (e) {
    console.warn('[SkulptEngine] Direct require failed, will use window.Sk:', e);
    Sk = window.Sk;
}

// ─── Sprite preamble ─────────────────────────────────────────────────────────
const SPRITE_PREAMBLE = `
class Sprite:
    """Control a sprite on the LeapBlocks stage from Python."""
    def __init__(self, name):
        self._name = str(name)

    def _action(self, action, *args):
        import __leap__
        __leap__._dispatch(self._name, action, list(args))

    def move_right(self, steps=20):   self._action("RIGHT",   steps)
    def move_left(self, steps=20):    self._action("LEFT",    steps)
    def move_up(self, steps=20):      self._action("UP",      steps)
    def move_down(self, steps=20):    self._action("DOWN",    steps)
    def move(self, steps=20):         self._action("FORWARD", steps)
    def goto(self, x, y):             self._action("GOTO",    x, y)
    def set_x(self, x):               self._action("SETX",    x)
    def set_y(self, y):               self._action("SETY",    y)
    def say(self, message, secs=2):   self._action("SAY",     str(message))
    def hide(self):                   self._action("HIDE")
    def show(self):                   self._action("SHOW")
    def set_size(self, pct):          self._action("SIZE",    pct)
    def point_in_direction(self, a):  self._action("ANGLE",   a)
    def switch_costume(self, name):   self._action("COSTUME", name)

def sprite(name): return Sprite(name)
`;

// ─── SkulptEngine ────────────────────────────────────────────────────────────
export class SkulptEngine {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onOut, onErr, actions }
        this._replReady = false;
    }

    _getSk() {
        const sk = Sk || window.Sk;
        if (!sk) throw new Error('Python runtime (Skulpt) is not available. Try refreshing the page.');
        return sk;
    }

    _buildLeapModule(sk) {
        const bridge = this.callbacks.actions;

        const toJS = (a) => {
            if (a == null) return a;
            if (a instanceof sk.builtin.int_)   return a.v;
            if (a instanceof sk.builtin.float_) return parseFloat(sk.ffi.remapToJs(a));
            if (a instanceof sk.builtin.str)    return a.v;
            try { return sk.ffi.remapToJs(a); } catch (_) { return a?.v; }
        };

        const dispatch = (skName, skAction, skArgs) => {
            const n   = toJS(skName);
            const act = toJS(skAction);
            const args = (skArgs?.v ?? []).map(toJS);
            switch (act) {
                case 'RIGHT':   bridge.moveRelative(n, 'RIGHT',  args[0] ?? 20); break;
                case 'LEFT':    bridge.moveRelative(n, 'LEFT',   args[0] ?? 20); break;
                case 'UP':      bridge.moveRelative(n, 'UP',     args[0] ?? 20); break;
                case 'DOWN':    bridge.moveRelative(n, 'DOWN',   args[0] ?? 20); break;
                case 'FORWARD': bridge.moveSteps(n,              args[0] ?? 20); break;
                case 'GOTO':    bridge.update(n, { x: args[0] ?? 0, y: args[1] ?? 0 }); break;
                case 'SETX':    bridge.update(n, { x: args[0] ?? 0 }); break;
                case 'SETY':    bridge.update(n, { y: args[0] ?? 0 }); break;
                case 'SAY':     bridge.update(n, { speech: args[0] ?? '' }); break;
                case 'HIDE':    bridge.update(n, { visible: false }); break;
                case 'SHOW':    bridge.update(n, { visible: true  }); break;
                case 'SIZE':    bridge.update(n, { size:  args[0] ?? 100 }); break;
                case 'ANGLE':   bridge.update(n, { angle: args[0] ?? 90  }); break;
                case 'COSTUME': bridge.update(n, { currentCostume: args[0] }); break;
                default: break;
            }
            return sk.builtin.none.none$;
        };

        const mod = new sk.builtin.module();
        mod.$d = { _dispatch: new sk.builtin.func(dispatch) };
        sk.sysmodules.mp$ass_subscript(new sk.builtin.str('__leap__'), mod);
    }

    _configureSkulpt(sk) {
        sk.configure({
            output: (text) => this.callbacks.onOut(text),
            read: (x) => {
                if (x === "__leap__" || x === "__leap__.py") {
                    return "def _dispatch(name, action, args): pass";
                }
                if (sk.builtinFiles?.files?.[x]) return sk.builtinFiles.files[x];
                throw new Error("Module not found: '" + x + "'");
            },
            __future__: sk.python3,
            execLimit: 30000,
        });

        this._buildLeapModule(sk);
    }

    _errStr(e) {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        try { if (e.tp$str) return e.tp$str().v; } catch (_) {}
        if (e.message && e.message !== '[object Event]') return e.message;
        if (e.toString && !e.toString().includes('[object')) return e.toString();
        try { return JSON.stringify(e); } catch { return 'Unknown error'; }
    }

    async runPython(code) {
        let sk;
        try { sk = this._getSk(); }
        catch (err) { this.callbacks.onErr(this._errStr(err)); throw err; }

        this._configureSkulpt(sk);
        this._replReady = false;

        try {
            const prog = SPRITE_PREAMBLE + '\n' + code;
            const runner = sk.importMainWithBody('<stdin>', false, prog, true);
            if (runner?.then) await runner;
        } catch (e) {
            const msg = this._errStr(e);
            this.callbacks.onErr(msg);
            throw new Error(msg);
        }
    }

    async runRepl(line) {
        let sk;
        try { sk = this._getSk(); }
        catch (err) { this.callbacks.onErr(this._errStr(err)); throw err; }

        this._configureSkulpt(sk);

        if (!this._replReady) {
            this._replReady = true;
            try {
                await sk.importMainWithBody('<repl-init>', false, SPRITE_PREAMBLE, true);
            } catch (_) {}
        }

        try {
            const result = await sk.importMainWithBody('<repl>', false, line, true);
            return result;
        } catch (e) {
            const msg = this._errStr(e);
            this.callbacks.onErr(msg);
            throw new Error(msg);
        }
    }
}
