interface LogEntry {
    value: string;
    label: string;
    timestamp: number;
}

export class DataLoggerRuntime {
    private entries: LogEntry[] = [];
    private callbacks: Array<(entry: LogEntry) => void> = [];

    log(value: string | number, label?: string) {
        const entry: LogEntry = {
            value: String(value),
            label: label || '',
            timestamp: Date.now()
        };
        this.entries.push(entry);
        console.log(`[Logger] #${this.entries.length}: ${entry.label ? entry.label + '=' : ''}${entry.value}`);
        this.callbacks.forEach(cb => cb(entry));
    }

    logWithLabel(label: string, value: string | number) {
        this.log(value, label);
    }

    clear() {
        this.entries = [];
        console.log('[Logger] Log cleared');
    }

    getCount(): number {
        return this.entries.length;
    }

    getEntry(index: number): string {
        const entry = this.entries[index - 1];
        return entry ? entry.value : '';
    }

    getLabel(index: number): string {
        const entry = this.entries[index - 1];
        return entry ? entry.label : '';
    }

    getTimestamp(index: number): number {
        const entry = this.entries[index - 1];
        return entry ? entry.timestamp : 0;
    }

    getAllEntries(): LogEntry[] {
        return [...this.entries];
    }

    toCSV(): string {
        if (this.entries.length === 0) return '';
        const header = 'index,label,value,timestamp';
        const rows = this.entries.map((e, i) =>
            `${i + 1},"${(e.label || '').replace(/"/g, '""')}","${e.value.replace(/"/g, '""')}",${e.timestamp}`
        );
        return header + '\n' + rows.join('\n');
    }

    toJSON(): string {
        return JSON.stringify(this.entries.map((e, i) => ({
            index: i + 1,
            label: e.label,
            value: e.value,
            timestamp: e.timestamp
        })), null, 2);
    }

    saveToCSV() {
        const csv = this.toCSV();
        if (!csv) {
            console.warn('[Logger] No entries to save');
            return;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `log_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('[Logger] CSV saved');
    }

    onNewEntry(callback: (entry: LogEntry) => void) {
        this.callbacks.push(callback);
    }

    removeCallback(callback: (entry: LogEntry) => void) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }
}
