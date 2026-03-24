/**
 * Central State Store for Variables and Lists
 * Persistent across blocks and sprites (for global scope)
 */

class VariableStore {
    constructor() {
        this.variables = new Map(); // name/id -> value
        this.lists = new Map();     // name/id -> array
        this.tables = new Map();    // name/id -> matrix
        
        // Listeners for UI updates
        this.listeners = [];
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    notify() {
        this.listeners.forEach(l => l({
            variables: Object.fromEntries(this.variables),
            lists: Object.fromEntries(this.lists),
            tables: Object.fromEntries(this.tables)
        }));
    }

    // Variables
    getVariable(name) {
        return this.variables.get(name) ?? 0;
    }

    setVariable(name, value) {
        this.variables.set(name, value);
        this.notify();
    }

    // Lists
    getList(name) {
        if (!this.lists.has(name)) this.lists.set(name, []);
        return this.lists.get(name);
    }

    addToList(name, item) {
        const list = this.getList(name);
        list.push(item);
        this.notify();
    }

    deleteFromList(name, index) {
        const list = this.getList(name);
        if (index > 0 && index <= list.length) {
            list.splice(index - 1, 1);
            this.notify();
        }
    }

    deleteAllOfList(name) {
        this.lists.set(name, []);
        this.notify();
    }

    // Tables
    getTable(name) {
        if (!this.tables.has(name)) this.tables.set(name, []);
        return this.tables.get(name);
    }

    setTableCell(name, row, col, value) {
        const table = this.getTable(name);
        if (!table[row]) table[row] = [];
        table[row][col] = value;
        this.notify();
    }
}

const variableStore = new VariableStore();
export default variableStore;
