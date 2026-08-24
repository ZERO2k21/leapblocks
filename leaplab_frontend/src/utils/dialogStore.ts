/**
 * Global dialog store — allows non-React code (blocklyInit.ts, hooks)
 * to trigger styled modals, and a React renderer to display them.
 */

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogRequest {
    id: number;
    type: DialogType;
    title: string;
    message: string;
    defaultValue?: string;
    resolve: (result: any) => void;
}

let _nextId = 0;
let _listener: ((req: DialogRequest) => void) | null = null;

function emit(request: DialogRequest) {
    if (_listener) _listener(request);
}

export function showAlert(message: string, title = 'LeapLab'): Promise<void> {
    return new Promise(resolve => {
        emit({ id: _nextId++, type: 'alert', title, message, resolve });
    });
}

export function showConfirm(message: string, title = 'LeapLab'): Promise<boolean> {
    return new Promise(resolve => {
        emit({ id: _nextId++, type: 'confirm', title, message, resolve });
    });
}

export function showPrompt(message: string, defaultValue = '', title = 'LeapLab'): Promise<string | null> {
    return new Promise(resolve => {
        emit({ id: _nextId++, type: 'prompt', title, message, defaultValue, resolve });
    });
}

export function setDialogListener(listener: (req: DialogRequest) => void) {
    _listener = listener;
}

export function clearDialogListener() {
    _listener = null;
}
