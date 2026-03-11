/**
 * SkulptEngine handles Python execution using Skulpt (in-browser Python).
 * It provides a bridge between Python code and the sprite system.
 */
export class SkulptEngine {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onOut: (text), onErr: (text), actions: { ...spriteActions } }
        this.isLoaded = false;
        this.isLoading = false;
    }

    async loadSkulpt() {
        if (this.isLoaded) return;
        if (this.isLoading) {
            while (this.isLoading) await new Promise(r => setTimeout(r, 100));
            return;
        }

        this.isLoading = true;
        try {
            await this._loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/skulpt.min.js");
            await this._loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/skulpt-stdlib.js");
            this.isLoaded = true;
            console.log("[SkulptEngine] Skulpt loaded successfully.");
        } catch (e) {
            console.error("[SkulptEngine] Failed to load Skulpt:", e);
        } finally {
            this.isLoading = false;
        }
    }

    _loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.crossOrigin = "anonymous";
            script.onload = resolve;
            script.onerror = (e) => {
                console.error(`[SkulptEngine] Failed to load script: ${src}`, e);
                reject(e);
            };
            document.head.appendChild(script);
        });
    }

    async runPython(code) {
        if (!this.isLoaded) await this.loadSkulpt();
        if (!window.Sk) return;

        const Sk = window.Sk;

        // Configure Skulpt
        Sk.configure({
            output: (text) => this.callbacks.onOut(text),
            read: (x) => {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                    throw "File not found: '" + x + "'";
                }
                return Sk.builtinFiles["files"][x];
            },
            __future__: Sk.python3
        });

        // Define the Sprite API in Python
        const bridge = this.callbacks.actions;
        
        // This is a simplified bridge. 
        // We'll define a 'Sprite' class in the main scope before running.
        const externalLibs = {
            "leapblocks": {
                "Sprite": (name) => {
                    return {
                        move_right: () => bridge.moveRelative(name, "RIGHT"),
                        move_left: () => bridge.moveRelative(name, "LEFT"),
                        move_up: () => bridge.moveRelative(name, "UP"),
                        move_down: () => bridge.moveRelative(name, "DOWN"),
                        say: (msg) => bridge.update(name, { speech: msg }),
                    };
                }
            }
        };

        // Injected preamble to make the API feel native
        const preamble = `
class Sprite:
    def __init__(self, name):
        self._name = name
    def move(self, steps):
        import leap_internal
        leap_internal.move_steps(self._name, steps)
    def move_right(self, steps=20):
        import leap_internal
        leap_internal.move(self._name, "RIGHT", steps)
    def move_left(self, steps=20):
        import leap_internal
        leap_internal.move(self._name, "LEFT", steps)
    def move_up(self, steps=20):
        import leap_internal
        leap_internal.move(self._name, "UP", steps)
    def move_down(self, steps=20):
        import leap_internal
        leap_internal.move(self._name, "DOWN", steps)
    def set_x(self, x):
        import leap_internal
        leap_internal.set_pos(self._name, x, None)
    def set_y(self, y):
        import leap_internal
        leap_internal.set_pos(self._name, None, y)
    def goto(self, x, y):
        import leap_internal
        leap_internal.set_pos(self._name, x, y)
    def point_in_direction(self, angle):
        import leap_internal
        leap_internal.set_angle(self._name, angle)
    def say(self, message):
        import leap_internal
        leap_internal.say(self._name, message)

`;

        // Define internal module for the bridge
        Sk.builtin.leap_internal = {
            move: Sk.builtin.func((name, dir, steps) => {
                const s = steps ? steps.v : 20;
                bridge.moveRelative(name.v, dir.v, s);
            }),
            move_steps: Sk.builtin.func((name, steps) => {
                bridge.moveSteps(name.v, steps.v);
            }),
            set_pos: Sk.builtin.func((name, x, y) => {
                const props = {};
                if (x && x !== Sk.builtin.none.none$) props.x = x.v;
                if (y && y !== Sk.builtin.none.none$) props.y = y.v;
                bridge.update(name.v, props);
            }),
            set_angle: Sk.builtin.func((name, angle) => {
                bridge.update(name.v, { angle: angle.v });
            }),
            say: Sk.builtin.func((name, msg) => {
                bridge.update(name.v, { speech: msg.v });
            })
        };

        try {
            const runner = Sk.importMainWithBody("<stdin>", false, preamble + code, true);
            if (runner && runner.then) {
                await runner;
            } else if (typeof Sk.miscellaneous.pyCheck60 === "function") {
                await Sk.miscellaneous.pyCheck60(runner);
            }
        } catch (e) {
            console.error("[SkulptEngine] Execution error:", e);
            this.callbacks.onErr(e.toString());
        }
    }
}
