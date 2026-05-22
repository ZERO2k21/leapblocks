/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SkulptEngine – in-browser Python execution.
 * Skulpt is imported directly from the npm package (bundled by webpack).
 * No CDN or dynamic script tags needed.
 */

// Import Skulpt from the npm package.
// Uses ESM import so both Vite (web) and electron-vite (desktop) can bundle it.
// Skulpt's CJS entry does: require('./dist/skulpt.min.js') + require('./dist/skulpt-stdlib.js')
// Vite's pre-bundler (esbuild) converts this CJS → ESM automatically.
import * as _SkModule from 'skulpt';

// Resolve the actual Sk object — handle both default export and window global
let Sk = _SkModule?.default || _SkModule || null;
if (!Sk || typeof Sk.configure !== 'function') {
    // Fallback: Skulpt attaches itself to window.Sk when loaded
    Sk = (typeof window !== 'undefined') ? window.Sk : null;
}
if (!Sk && typeof window !== 'undefined') {
    console.warn('[SkulptEngine] Skulpt not resolved via import, waiting for window.Sk...');
}

// ─── Sprite preamble (PictoBlox-compatible API) ──────────────────────────────
const SPRITE_PREAMBLE = `
class Sprite:
    """Control a sprite on the LeapBlocks stage from Python.
    
    Usage:
        sprite = Sprite('Robot')
        sprite.say('Hello!')
        sprite.move(50)
        sprite.turn_right()
        sprite.go_to(100, 50)
    """
    def __init__(self, name):
        self._name = str(name)
        _leap_dispatch(self._name, "INIT", [])

    def _action(self, action, *args):
        # Use the global _leap_dispatch function injected by SkulptEngine
        _leap_dispatch(self._name, action, list(args))

    # ─── Movement and Positioning ───
    def move(self, steps=20):
        """Advance the sprite forward by steps in its current direction."""
        self._action("FORWARD", steps)
    
    def move_right(self, steps=20):
        """Move the sprite to the right."""
        self._action("RIGHT", steps)
    
    def move_left(self, steps=20):
        """Move the sprite to the left."""
        self._action("LEFT", steps)
    
    def move_up(self, steps=20):
        """Move the sprite up."""
        self._action("UP", steps)
    
    def move_down(self, steps=20):
        """Move the sprite down."""
        self._action("DOWN", steps)
    
    def turn_right(self, times=1):
        """Rotate the sprite to the right."""
        self._action("TURN_RIGHT", times)
    
    def turn_left(self, times=1):
        """Rotate the sprite to the left."""
        self._action("TURN_LEFT", times)
    
    def go_to(self, x, y):
        """Move the sprite to a specific coordinate position."""
        self._action("GOTO", x, y)
    
    def setx(self, x):
        """Set the absolute horizontal (x) coordinate."""
        self._action("SETX", x)
    
    def sety(self, y):
        """Set the absolute vertical (y) coordinate."""
        self._action("SETY", y)
    
    def set_x(self, x):
        """Set the absolute horizontal (x) coordinate."""
        self._action("SETX", x)
    
    def set_y(self, y):
        """Set the absolute vertical (y) coordinate."""
        self._action("SETY", y)

    # ─── Appearance and Interaction ───
    def say(self, message, secs=2):
        """Display a speech bubble with text for specified duration."""
        self._action("SAY", str(message), secs)
    
    def think(self, message, secs=2):
        """Display a thought bubble with text."""
        self._action("THINK", str(message), secs)
    
    def hide(self):
        """Make the sprite invisible."""
        self._action("HIDE")
    
    def show(self):
        """Make the sprite visible."""
        self._action("SHOW")
    
    def set_size(self, pct):
        """Modify the size of the sprite (percentage)."""
        self._action("SIZE", pct)
    
    def change_size(self, delta):
        """Change the size by a delta amount."""
        self._action("CHANGE_SIZE", delta)
    
    def point_in_direction(self, angle):
        """Set the sprite's direction in degrees."""
        self._action("ANGLE", angle)
    
    def next_costume(self):
        """Switch to the next costume."""
        self._action("NEXT_COSTUME")
    
    def switch_costume(self, name):
        """Switch to a specific costume by name."""
        self._action("COSTUME", name)

# ─── Helper function ───
def sprite(name):
    """Create a sprite by its library name."""
    return Sprite(name)
`;

// ─── SkulptEngine ────────────────────────────────────────────────────────────
export class SkulptEngine {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onOut, onErr, actions }
        this._replReady = false;
    }

    _getSk() {
        // Try the imported reference first, then window.Sk as fallback
        let sk = Sk;
        if (!sk || typeof sk.configure !== 'function') {
            sk = (typeof window !== 'undefined') ? window.Sk : null;
            if (sk && typeof sk.configure === 'function') {
                Sk = sk; // Cache for future calls
            }
        }
        if (!sk || typeof sk.configure !== 'function') {
            throw new Error('Python runtime (Skulpt) is not available. Try refreshing the page.');
        }
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
                // Initialization
                case 'INIT':       bridge.initSprite(n); break;

                // Movement
                case 'RIGHT':      bridge.moveRelative(n, 'RIGHT',  args[0] ?? 20); break;
                case 'LEFT':       bridge.moveRelative(n, 'LEFT',   args[0] ?? 20); break;
                case 'UP':         bridge.moveRelative(n, 'UP',     args[0] ?? 20); break;
                case 'DOWN':       bridge.moveRelative(n, 'DOWN',   args[0] ?? 20); break;
                case 'FORWARD':    bridge.moveSteps(n,              args[0] ?? 20); break;
                case 'GOTO':       bridge.update(n, { x: args[0] ?? 0, y: args[1] ?? 0, position: { x: args[0] ?? 0, y: args[1] ?? 0 } }); break;
                case 'SETX':       bridge.update(n, { x: args[0] ?? 0, position: { x: args[0] ?? 0 } }); break;
                case 'SETY':       bridge.update(n, { y: args[0] ?? 0, position: { y: args[0] ?? 0 } }); break;
                case 'TURN_RIGHT': bridge.update(n, { angle: (old) => (old ?? 0) + (15 * (args[0] ?? 1)), direction: (old) => (old ?? 0) + (15 * (args[0] ?? 1)) }); break;
                case 'TURN_LEFT':  bridge.update(n, { angle: (old) => (old ?? 0) - (15 * (args[0] ?? 1)), direction: (old) => (old ?? 0) - (15 * (args[0] ?? 1)) }); break;
                
                // Appearance
                case 'SAY':     bridge.update(n, { speech: args[0] ?? '' }); break;
                case 'THINK':   bridge.update(n, { speech: '💭 ' + (args[0] ?? '') }); break;
                case 'HIDE':    bridge.update(n, { visible: false }); break;
                case 'SHOW':    bridge.update(n, { visible: true  }); break;
                case 'SIZE':    bridge.update(n, { size:  args[0] ?? 100 }); break;
                case 'CHANGE_SIZE': bridge.update(n, { size: (old) => (old || 100) + (args[0] ?? 10) }); break;
                case 'ANGLE':   bridge.update(n, { angle: args[0] ?? 0  }); break;
                case 'COSTUME': bridge.update(n, { currentCostume: args[0] }); break;
                case 'NEXT_COSTUME': 
                    bridge.update(n, { nextCostume: true }); 
                    break;
                default: break;
            }
            return sk.builtin.none.none$;
        };

        // Store dispatch function globally for the preamble to use
        this._dispatchFunc = dispatch;
        
        // Create the __leap__ module
        const mod = new sk.builtin.module();
        mod.$d = { _dispatch: new sk.builtin.func(dispatch) };
        
        // Register in sysmodules
        sk.sysmodules.mp$ass_subscript(new sk.builtin.str('__leap__'), mod);
        
        // Also add to builtins for direct access
        if (sk.builtins) {
            sk.builtins.__leap__ = mod;
            // Add global dispatch function for preamble
            sk.builtins._leap_dispatch = new sk.builtin.func(dispatch);
        }
    }

    _configureSkulpt(sk) {
        // Build the __leap__ module first to set up builtins
        this._buildLeapModule(sk);
        
        sk.configure({
            output: (text) => this.callbacks.onOut(text),
            read: (x) => {
                if (sk.builtinFiles?.files?.[x]) return sk.builtinFiles.files[x];
                throw new Error("Module not found: '" + x + "'");
            },
            __future__: sk.python3,
            execLimit: 30000,
            inputfun: (promptText) => {
                if (promptText) {
                    this.callbacks.onOut(promptText);
                }

                const susp = new sk.misceval.Suspension();
                susp.resume = () => {
                    if (susp.data.error) throw susp.data.error;
                    return new sk.builtin.str(susp.data.result || "");
                };
                susp.data = {
                    type: "Sk.promise",
                    promise: new Promise((resolve) => {
                        if (this.callbacks.onInputRequested) {
                            this.callbacks.onInputRequested(promptText, resolve);
                        } else {
                            resolve(window.prompt(promptText) || "");
                        }
                    })
                };
                return susp;
            }
        });
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
