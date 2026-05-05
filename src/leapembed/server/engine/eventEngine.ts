/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
type EventHandler = (...args: any[]) => void;

class EventEngine {
    private events: Map<string, EventHandler[]> = new Map();

    on(event: string, handler: EventHandler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(handler);
    }

    off(event: string, handler: EventHandler) {
        const handlers = this.events.get(event);
        if (handlers) {
            this.events.set(event, handlers.filter(h => h !== handler));
        }
    }

    trigger(event: string, ...args: any[]) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }

    clear() {
        this.events.clear();
    }
}

let _eventEngine: EventEngine | null = null;
export function getEventEngine(): EventEngine {
    if (!_eventEngine) _eventEngine = new EventEngine();
    return _eventEngine;
}
export const eventEngine: EventEngine = new Proxy({} as EventEngine, {
    get(_target, prop) {
        const instance = getEventEngine();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getEventEngine() as any)[prop] = value; return true; }
});
export default eventEngine;
