/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * Central State Store for Variables and Lists
 * Persistent across blocks and sprites (for global scope)
 */

export interface VariableStoreState {
    variables: Record<string, any>;
    lists: Record<string, any[]>;
    tables: Record<string, any[][]>;
}

export type StoreListener = (state: VariableStoreState) => void;

export class VariableStore {
    private variables: Map<string, any>;
    private lists: Map<string, any[]>;
    private tables: Map<string, any[][]>;
    private listeners: StoreListener[];

    constructor() {
        this.variables = new Map(); // name/id -> value
        this.lists = new Map();     // name/id -> array
        this.tables = new Map();    // name/id -> matrix
        
        // Listeners for UI updates
        this.listeners = [];
    }

    subscribe(callback: StoreListener): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify(): void {
        const state: VariableStoreState = {
            variables: Object.fromEntries(this.variables),
            lists: Object.fromEntries(this.lists),
            tables: Object.fromEntries(this.tables)
        };
        this.listeners.forEach(l => l(state));
    }

    // Variables
    getVariable(name: string): any {
        return this.variables.get(name) ?? 0;
    }

    setVariable(name: string, value: any): void {
        this.variables.set(name, value);
        this.notify();
    }

    // Lists
    getList(name: string): any[] {
        if (!this.lists.has(name)) this.lists.set(name, []);
        return this.lists.get(name)!;
    }

    addToList(name: string, item: any): void {
        const list = this.getList(name);
        list.push(item);
        this.notify();
    }

    deleteFromList(name: string, index: number): void {
        const list = this.getList(name);
        if (index > 0 && index <= list.length) {
            list.splice(index - 1, 1);
            this.notify();
        }
    }

    deleteAllOfList(name: string): void {
        this.lists.set(name, []);
        this.notify();
    }

    // Tables
    getTable(name: string): any[][] {
        if (!this.tables.has(name)) this.tables.set(name, []);
        return this.tables.get(name)!;
    }

    setTableCell(name: string, row: number, col: number, value: any): void {
        const table = this.getTable(name);
        if (!table[row]) table[row] = [];
        table[row][col] = value;
        this.notify();
    }
}

let _variableStore: VariableStore | null = null;

function getVariableStore(): VariableStore {
    if (!_variableStore) _variableStore = new VariableStore();
    return _variableStore;
}

const variableStore = new Proxy({} as VariableStore, {
    get(_target, prop: keyof VariableStore) {
        const instance = getVariableStore();
        const value = instance[prop];
        return typeof value === 'function' ? (value as Function).bind(instance) : value;
    },
    set(_target, prop: keyof VariableStore, value: any) {
        (getVariableStore() as any)[prop] = value;
        return true;
    }
});

export default variableStore;
