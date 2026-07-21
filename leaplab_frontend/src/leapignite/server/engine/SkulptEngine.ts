import * as _SkModule from 'skulpt';
import { VirtualFileSystem } from './VirtualFileSystem';
import { SPRITE_PREAMBLE } from './spritePreamble';
import { buildLeapModule, buildOsModule, patchFileConstructor } from './filePatching';

let Sk: any = (_SkModule as any)?.default || _SkModule || null;
if (!Sk || typeof Sk.configure !== 'function') {
    Sk = (typeof window !== 'undefined') ? (window as any).Sk : null;
}
if (!Sk && typeof window !== 'undefined') {
    console.warn('[SkulptEngine] Skulpt not resolved via import, waiting for window.Sk...');
}

interface SkulptEngineCallbacks {
    actions: any;
    onOut: (text: string) => void;
    onErr: (msg: string) => void;
    onInputRequested?: (promptText: string, resolve: (value: string) => void) => void;
}

export class SkulptEngine {
    callbacks: SkulptEngineCallbacks;
    _replReady: boolean;
    _stopRequested: boolean;
    vfs: VirtualFileSystem;
    _dispatchFunc: any;

    constructor(callbacks: SkulptEngineCallbacks) {
        this.callbacks = callbacks;
        this._replReady = false;
        this._stopRequested = false;
        this.vfs = new VirtualFileSystem();
        this._dispatchFunc = null;
    }

    loadProjectFiles(projectFiles: Record<string, string>): void { this.vfs.loadFromProjectFiles(projectFiles); }
    getModifiedFiles(): Record<string, string> { return this.vfs.getModifiedFiles(); }

    _getSk(): any {
        let sk = Sk;
        if (!sk || typeof sk.configure !== 'function') {
            sk = (typeof window !== 'undefined') ? (window as any).Sk : null;
            if (sk && typeof sk.configure === 'function') Sk = sk;
        }
        if (!sk || typeof sk.configure !== 'function') {
            throw new Error('Python runtime (Skulpt) is not available. Try refreshing the page.');
        }
        return sk;
    }

    _configureSkulpt(sk: any): void {
        const bridge = this.callbacks.actions;
        buildLeapModule(sk, bridge);
        buildOsModule(sk, this.vfs);
        this._stopRequested = false;

        sk.configure({
            output: (text: string) => this.callbacks.onOut(text),
            read: (x: string) => {
                if (sk.builtinFiles?.files?.[x]) return sk.builtinFiles.files[x];
                throw new Error("Module not found: '" + x + "'");
            },
            __future__: sk.python3,
            execLimit: 600000,
            yieldLimit: 100,
            killableWhile: true,
            killableFor: true,
            nonreadopen: true,
            filewrite: (fileObj: any, str: string) => {
                if (fileObj.fileno < 10) return;
                this.vfs.writeFile(fileObj.name, sk.ffi.remapToJs(str), true);
            },
            inputfun: (promptText: string) => {
                if (this._stopRequested) throw new Error('Execution stopped');
                if (promptText) this.callbacks.onOut(promptText);
                return new Promise((resolve: (value: string) => void) => {
                    if (this.callbacks.onInputRequested) {
                        this.callbacks.onInputRequested(promptText, resolve);
                    } else {
                        resolve(window.prompt(promptText) || "");
                    }
                });
            }
        });

        patchFileConstructor(sk, this.vfs);
        if (sk.builtins) {
            sk.builtins.open = new sk.builtin.func(function (this: any, name: any, mode: any, buffering: any) {
                return new sk.builtin.file(name, mode, buffering);
            });
        }
    }

    _errStr(e: any): string {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        try { if (e.tp$str) return e.tp$str().v; } catch (_) {}
        if (e.message && e.message !== '[object Event]') return e.message;
        if (e.toString && !e.toString().includes('[object')) return e.toString();
        try { return JSON.stringify(e); } catch { return 'Unknown error'; }
    }

    async runPython(code: string): Promise<void> {
        let sk: any;
        try { sk = this._getSk(); }
        catch (err: any) { this.callbacks.onErr(this._errStr(err)); throw err; }

        this._configureSkulpt(sk);
        this._replReady = false;

        try {
            await sk.misceval.asyncToPromise(
                () => sk.importMainWithBody('<stdin>', false, SPRITE_PREAMBLE + '\n' + code, true)
            );
        } catch (e: any) {
            const msg = this._errStr(e);
            this.callbacks.onErr(msg);
            throw new Error(msg);
        }
    }

    async runRepl(line: string): Promise<any> {
        let sk: any;
        try { sk = this._getSk(); }
        catch (err: any) { this.callbacks.onErr(this._errStr(err)); throw err; }

        this._configureSkulpt(sk);

        if (!this._replReady) {
            this._replReady = true;
            try {
                await sk.misceval.asyncToPromise(
                    () => sk.importMainWithBody('<repl-init>', false, SPRITE_PREAMBLE, true)
                );
            } catch (_) {}
        }

        try {
            return await sk.misceval.asyncToPromise(
                () => sk.importMainWithBody('<repl>', false, line, true)
            );
        } catch (e: any) {
            const msg = this._errStr(e);
            this.callbacks.onErr(msg);
            throw new Error(msg);
        }
    }

    stop(): void {
        this._stopRequested = true;
        const sk = Sk || ((typeof window !== 'undefined') ? (window as any).Sk : null);
        if (sk) { sk.execLimit = 1; sk.yieldLimit = 1; }
    }
}
