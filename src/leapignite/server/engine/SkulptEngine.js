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
import { VirtualFileSystem } from './VirtualFileSystem';

// Resolve the actual Sk object — handle both default export and window global
let Sk = _SkModule?.default || _SkModule || null;
if (!Sk || typeof Sk.configure !== 'function') {
    // Fallback: Skulpt attaches itself to window.Sk when loaded
    Sk = (typeof window !== 'undefined') ? window.Sk : null;
}
if (!Sk && typeof window !== 'undefined') {
    console.warn('[SkulptEngine] Skulpt not resolved via import, waiting for window.Sk...');
}

// ─── Sprite preamble (LeapBlox-compatible API) ──────────────────────────────
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
        this._stopRequested = false;
        this.vfs = new VirtualFileSystem();
    }

    loadProjectFiles(projectFiles) {
        this.vfs.loadFromProjectFiles(projectFiles);
    }

    getModifiedFiles() {
        return this.vfs.getModifiedFiles();
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
            if (a instanceof sk.builtin.int_) return a.v;
            if (a instanceof sk.builtin.float_) return parseFloat(sk.ffi.remapToJs(a));
            if (a instanceof sk.builtin.str) return a.v;
            try { return sk.ffi.remapToJs(a); } catch (_) { return a?.v; }
        };

        const dispatch = (skName, skAction, skArgs) => {
            const n = toJS(skName);
            const act = toJS(skAction);
            const args = (skArgs?.v ?? []).map(toJS);
            switch (act) {
                case '__STOP__':
                    throw new Error('Execution stopped');
                // Initialization
                case 'INIT': bridge.initSprite(n); break;

                // Movement
                case 'RIGHT': bridge.moveRelative(n, 'RIGHT', args[0] ?? 20); break;
                case 'LEFT': bridge.moveRelative(n, 'LEFT', args[0] ?? 20); break;
                case 'UP': bridge.moveRelative(n, 'UP', args[0] ?? 20); break;
                case 'DOWN': bridge.moveRelative(n, 'DOWN', args[0] ?? 20); break;
                case 'FORWARD': bridge.moveSteps(n, args[0] ?? 20); break;
                case 'GOTO': bridge.update(n, { x: args[0] ?? 0, y: args[1] ?? 0, position: { x: args[0] ?? 0, y: args[1] ?? 0 } }); break;
                case 'SETX': bridge.update(n, { x: args[0] ?? 0, position: { x: args[0] ?? 0 } }); break;
                case 'SETY': bridge.update(n, { y: args[0] ?? 0, position: { y: args[0] ?? 0 } }); break;
                case 'TURN_RIGHT': bridge.update(n, { angle: (old) => (old ?? 0) + (15 * (args[0] ?? 1)), direction: (old) => (old ?? 0) + (15 * (args[0] ?? 1)) }); break;
                case 'TURN_LEFT': bridge.update(n, { angle: (old) => (old ?? 0) - (15 * (args[0] ?? 1)), direction: (old) => (old ?? 0) - (15 * (args[0] ?? 1)) }); break;

                // Appearance
                case 'SAY': bridge.update(n, { speech: args[0] ?? '' }); break;
                case 'THINK': bridge.update(n, { speech: '💭 ' + (args[0] ?? '') }); break;
                case 'HIDE': bridge.update(n, { visible: false }); break;
                case 'SHOW': bridge.update(n, { visible: true }); break;
                case 'SIZE': bridge.update(n, { size: args[0] ?? 100 }); break;
                case 'CHANGE_SIZE': bridge.update(n, { size: (old) => (old || 100) + (args[0] ?? 10) }); break;
                case 'ANGLE': bridge.update(n, { angle: args[0] ?? 0 }); break;
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

    _registerOsModule(sk) {
        const vfs = this.vfs;

        const pathModule = new sk.builtin.module();
        pathModule.$d = {
            exists: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                return new sk.builtin.bool(vfs.exists(p));
            }),
            isfile: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                return new sk.builtin.bool(vfs.isFile(p));
            }),
            isdir: new sk.builtin.func((path) => {
                return new sk.builtin.bool(false);
            }),
            basename: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                const parts = p.split('/');
                return new sk.builtin.str(parts[parts.length - 1] || p);
            }),
            dirname: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                const parts = p.split('/');
                parts.pop();
                return new sk.builtin.str(parts.join('/') || '.');
            }),
            join: new sk.builtin.func((...args) => {
                const parts = args.map(a => sk.ffi.remapToJs(a));
                return new sk.builtin.str(parts.join('/'));
            }),
            splitext: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                const dotIndex = p.lastIndexOf('.');
                if (dotIndex === -1) {
                    return new sk.builtin.tuple([new sk.builtin.str(p), new sk.builtin.str('')]);
                }
                return new sk.builtin.tuple([
                    new sk.builtin.str(p.substring(0, dotIndex)),
                    new sk.builtin.str(p.substring(dotIndex))
                ]);
            }),
            getsize: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                try {
                    return new sk.builtin.int_(vfs.getFileSize(p));
                } catch (e) {
                    throw new sk.builtin.OSError(e.message);
                }
            }),
        };

        const osModule = new sk.builtin.module();
        osModule.$d = {
            path: pathModule,
            listdir: new sk.builtin.func((path) => {
                const files = vfs.listFiles();
                const pyList = files.map(f => new sk.builtin.str(f));
                return new sk.builtin.list(pyList);
            }),
            remove: new sk.builtin.func((path) => {
                const p = sk.ffi.remapToJs(path);
                if (!vfs.exists(p)) {
                    throw new sk.builtin.FileNotFoundError(`[Errno 2] No such file or directory: '${p}'`);
                }
                vfs.deleteFile(p);
                return sk.builtin.none.none$;
            }),
            getcwd: new sk.builtin.func(() => {
                return new sk.builtin.str('/');
            }),
        };

        sk.sysmodules.mp$ass_subscript(new sk.builtin.str('os'), osModule);
        sk.sysmodules.mp$ass_subscript(new sk.builtin.str('os.path'), pathModule);
    }

    _configureSkulpt(sk) {
        // Build the __leap__ module first to set up builtins
        this._buildLeapModule(sk);
        this._registerOsModule(sk);
        this._stopRequested = false;

        sk.configure({
            output: (text) => this.callbacks.onOut(text),
            read: (x) => {
                if (sk.builtinFiles?.files?.[x]) return sk.builtinFiles.files[x];
                throw new Error("Module not found: '" + x + "'");
            },
            __future__: sk.python3,
            execLimit: 600000,
            yieldLimit: 100,
            killableWhile: true,
            killableFor: true,
            nonreadopen: true,
            filewrite: (fileObj, str) => {
                const name = fileObj.name;
                const content = sk.ffi.remapToJs(str);
                const mode = sk.ffi.remapToJs(fileObj.mode);
                const append = mode === 'a' || mode === 'ab';
                this.vfs.writeFile(name, content, append);
            },
            inputfun: (promptText) => {
                if (this._stopRequested) {
                    throw new Error('Execution stopped');
                }
                if (promptText) {
                    this.callbacks.onOut(promptText);
                }

                return new Promise((resolve) => {
                    if (this.callbacks.onInputRequested) {
                        this.callbacks.onInputRequested(promptText, resolve);
                    } else {
                        resolve(window.prompt(promptText) || "");
                    }
                });
            }
        });

        this._patchFileConstructor(sk);
    }

    _patchFileConstructor(sk) {
        const vfs = this.vfs;
        const OriginalFile = sk.builtin.file;

        sk.builtin.file = function(name, mode, buffering) {
            if (!(this instanceof sk.builtin.file)) {
                return new sk.builtin.file(name, mode, buffering);
            }

            this.mode = mode;
            this.name = sk.ffi.remapToJs(name);
            this.closed = false;

            if (this.name === "/dev/stdout") {
                this.data$ = sk.builtin.none.none$;
                this.fileno = 1;
            } else if (this.name === "/dev/stdin") {
                this.fileno = 0;
            } else if (this.name === "/dev/stderr") {
                this.fileno = 2;
            } else {
                this.fileno = 10;
                const modeStr = mode.v || mode;

                if (modeStr === 'w' || modeStr === 'wb' || modeStr === 'a' || modeStr === 'ab') {
                    if (modeStr === 'a' || modeStr === 'ab') {
                        try {
                            const existing = vfs.readFile(this.name);
                            this.data$ = existing;
                        } catch (_) {
                            this.data$ = "";
                        }
                    } else {
                        this.data$ = "";
                    }
                } else {
                    try {
                        this.data$ = vfs.readFile(this.name);
                    } catch (e) {
                        throw new sk.builtin.IOError(e.message);
                    }
                }

                this.lineList = this.data$.split("\n");
                this.lineList = this.lineList.slice(0, -1);

                for (let i in this.lineList) {
                    this.lineList[i] = this.lineList[i] + "\n";
                }
                this.currentLine = 0;
            }
            this.pos$ = 0;

            if (sk.fileopen && this.fileno >= 10) {
                sk.fileopen(this);
            }

            return this;
        };

        sk.builtin.file.prototype = OriginalFile.prototype;
        sk.builtin.file.prototype.constructor = sk.builtin.file;
    }

    _errStr(e) {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        try { if (e.tp$str) return e.tp$str().v; } catch (_) { /* noop */ }
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
            await sk.misceval.asyncToPromise(
                () => sk.importMainWithBody('<stdin>', false, prog, true)
            );
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
                await sk.misceval.asyncToPromise(
                    () => sk.importMainWithBody('<repl-init>', false, SPRITE_PREAMBLE, true)
                );
            } catch (_) { /* noop */ }
        }

        try {
            const result = await sk.misceval.asyncToPromise(
                () => sk.importMainWithBody('<repl>', false, line, true)
            );
            return result;
        } catch (e) {
            const msg = this._errStr(e);
            this.callbacks.onErr(msg);
            throw new Error(msg);
        }
    }

    stop() {
        this._stopRequested = true;
        const sk = Sk || ((typeof window !== 'undefined') ? window.Sk : null);
        if (sk) {
            sk.execLimit = 1;
            sk.yieldLimit = 1;
        }
    }
}
