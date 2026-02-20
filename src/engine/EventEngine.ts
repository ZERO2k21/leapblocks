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

export const eventEngine = new EventEngine();
export default eventEngine;
