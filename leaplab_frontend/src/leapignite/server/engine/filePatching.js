export function patchFileConstructor(sk, vfs) {
    const OriginalFile = sk.builtin.file;

    sk.builtin.file = function (name, mode, buffering) {
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
                    try { this.data$ = vfs.readFile(this.name); } catch (_) { this.data$ = ""; }
                } else {
                    this.data$ = "";
                    vfs.writeFile(this.name, "", false);
                }
            } else {
                try { this.data$ = vfs.readFile(this.name); } catch (e) { throw new sk.builtin.IOError(e.message); }
            }

            this.lineList = this.data$.split("\n").slice(0, -1);
            for (let i in this.lineList) { this.lineList[i] = this.lineList[i] + "\n"; }
            this.currentLine = 0;
        }
        this.pos$ = 0;

        if (sk.fileopen && this.fileno >= 10) {
            sk.fileopen(this);
        }

        return this;
    };

    Object.getOwnPropertyNames(OriginalFile).forEach((propName) => {
        if (propName !== 'prototype') {
            Object.defineProperty(sk.builtin.file, propName, Object.getOwnPropertyDescriptor(OriginalFile, propName));
        }
    });

    sk.builtin.file.prototype = OriginalFile.prototype;
    sk.builtin.file.prototype.constructor = sk.builtin.file;
}

export function buildOsModule(sk, vfs) {
    const pathModule = new sk.builtin.module();
    pathModule.$d = {
        exists: new sk.builtin.func((path) => new sk.builtin.bool(vfs.exists(sk.ffi.remapToJs(path)))),
        isfile: new sk.builtin.func((path) => new sk.builtin.bool(vfs.isFile(sk.ffi.remapToJs(path)))),
        isdir: new sk.builtin.func(() => new sk.builtin.bool(false)),
        basename: new sk.builtin.func((path) => { const p = sk.ffi.remapToJs(path); const parts = p.split('/'); return new sk.builtin.str(parts[parts.length - 1] || p); }),
        dirname: new sk.builtin.func((path) => { const p = sk.ffi.remapToJs(path); const parts = p.split('/'); parts.pop(); return new sk.builtin.str(parts.join('/') || '.'); }),
        join: new sk.builtin.func((...args) => new sk.builtin.str(args.map(a => sk.ffi.remapToJs(a)).join('/'))),
        splitext: new sk.builtin.func((path) => {
            const p = sk.ffi.remapToJs(path);
            const dotIndex = p.lastIndexOf('.');
            if (dotIndex === -1) return new sk.builtin.tuple([new sk.builtin.str(p), new sk.builtin.str('')]);
            return new sk.builtin.tuple([new sk.builtin.str(p.substring(0, dotIndex)), new sk.builtin.str(p.substring(dotIndex))]);
        }),
        getsize: new sk.builtin.func((path) => {
            try { return new sk.builtin.int_(vfs.getFileSize(sk.ffi.remapToJs(path))); } catch (e) { throw new sk.builtin.OSError(e.message); }
        }),
    };

    const osModule = new sk.builtin.module();
    osModule.$d = {
        path: pathModule,
        listdir: new sk.builtin.func(() => { const files = vfs.listFiles(); return new sk.builtin.list(files.map(f => new sk.builtin.str(f))); }),
        remove: new sk.builtin.func((path) => {
            const p = sk.ffi.remapToJs(path);
            if (!vfs.exists(p)) throw new sk.builtin.FileNotFoundError(`[Errno 2] No such file or directory: '${p}'`);
            vfs.deleteFile(p);
            return sk.builtin.none.none$;
        }),
        getcwd: new sk.builtin.func(() => new sk.builtin.str('/')),
    };

    sk.sysmodules.mp$ass_subscript(new sk.builtin.str('os'), osModule);
    sk.sysmodules.mp$ass_subscript(new sk.builtin.str('os.path'), pathModule);
}

export function buildLeapModule(sk, bridge) {
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
            case '__STOP__': throw new Error('Execution stopped');
            case 'INIT': bridge.initSprite(n); break;
            case 'RIGHT': bridge.moveRelative(n, 'RIGHT', args[0] ?? 20); break;
            case 'LEFT': bridge.moveRelative(n, 'LEFT', args[0] ?? 20); break;
            case 'UP': bridge.moveRelative(n, 'UP', args[0] ?? 20); break;
            case 'DOWN': bridge.moveRelative(n, 'DOWN', args[0] ?? 20); break;
            case 'FORWARD': bridge.moveSteps(n, args[0] ?? 20); break;
            case 'GOTO': bridge.update(n, { x: args[0] ?? 0, y: args[1] ?? 0, position: { x: args[0] ?? 0, y: args[1] ?? 0 } }); break;
            case 'SETX': bridge.update(n, { x: args[0] ?? 0, position: { x: args[0] ?? 0 } }); break;
            case 'SETY': bridge.update(n, { y: args[0] ?? 0, position: { y: args[0] ?? 0 } }); break;
            case 'TURN_RIGHT': bridge.update(n, { angle: (old) => (old ?? 0) + (15 * (args[0] ?? 1)) }); break;
            case 'TURN_LEFT': bridge.update(n, { angle: (old) => (old ?? 0) - (15 * (args[0] ?? 1)) }); break;
            case 'SAY': bridge.update(n, { speech: args[0] ?? '' }); break;
            case 'THINK': bridge.update(n, { speech: '💭 ' + (args[0] ?? '') }); break;
            case 'HIDE': bridge.update(n, { visible: false }); break;
            case 'SHOW': bridge.update(n, { visible: true }); break;
            case 'SIZE': bridge.update(n, { size: args[0] ?? 100 }); break;
            case 'CHANGE_SIZE': bridge.update(n, { size: (old) => (old || 100) + (args[0] ?? 10) }); break;
            case 'ANGLE': bridge.update(n, { angle: args[0] ?? 0 }); break;
            case 'COSTUME': bridge.update(n, { currentCostume: args[0] }); break;
            case 'NEXT_COSTUME': bridge.update(n, { nextCostume: true }); break;
            default: break;
        }
        return sk.builtin.none.none$;
    };

    const mod = new sk.builtin.module();
    mod.$d = { _dispatch: new sk.builtin.func(dispatch) };
    sk.sysmodules.mp$ass_subscript(new sk.builtin.str('__leap__'), mod);

    if (sk.builtins) {
        sk.builtins.__leap__ = mod;
        sk.builtins._leap_dispatch = new sk.builtin.func(dispatch);
    }
}
