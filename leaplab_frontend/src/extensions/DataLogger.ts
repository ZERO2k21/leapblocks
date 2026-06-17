// DataLogger.ts - Data logging blocks for recording and inspecting values

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const dataLoggerBlocks = [
    {
        type: 'logger_log',
        message0: 'log %1',
        args0: [{ type: 'field_input', name: 'VALUE', text: '0' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6F00',
        tooltip: 'Log a value to the data logger',
        helpUrl: ''
    },
    {
        type: 'logger_log_with_label',
        message0: 'log %1 as %2',
        args0: [
            { type: 'field_input', name: 'VALUE', text: '0' },
            { type: 'field_input', name: 'LABEL', text: 'data' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6F00',
        tooltip: 'Log a value with a label',
        helpUrl: ''
    },
    {
        type: 'logger_clear',
        message0: 'clear log',
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6F00',
        tooltip: 'Clear all logged entries',
        helpUrl: ''
    },
    {
        type: 'logger_get_count',
        message0: 'log count',
        output: 'Number',
        colour: '#E65100',
        tooltip: 'Returns the number of logged entries',
        helpUrl: ''
    },
    {
        type: 'logger_get_entry',
        message0: 'log entry %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'String',
        colour: '#E65100',
        tooltip: 'Returns the log entry at the given index (1-based)',
        helpUrl: ''
    },
    {
        type: 'logger_get_label',
        message0: 'label of log entry %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'String',
        colour: '#E65100',
        tooltip: 'Returns the label of the log entry at the given index',
        helpUrl: ''
    },
    {
        type: 'logger_save_to_csv',
        message0: 'save log as CSV',
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6F00',
        tooltip: 'Download the log data as a CSV file',
        helpUrl: ''
    },
    {
        type: 'logger_on_new_entry',
        message0: 'when new entry logged %1',
        args0: [{ type: 'input_statement', name: 'BODY' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6F00',
        tooltip: 'Event: triggered when a new entry is logged',
        helpUrl: ''
    }
];

// Log entry interface
interface LogEntry {
    value: string;
    label: string;
    timestamp: number;
}

// Runtime implementation
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
        const entry = this.entries[index - 1]; // 1-based
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

    // Export as CSV string
    toCSV(): string {
        if (this.entries.length === 0) return '';
        const header = 'index,label,value,timestamp';
        const rows = this.entries.map((e, i) =>
            `${i + 1},"${(e.label || '').replace(/"/g, '""')}","${e.value.replace(/"/g, '""')}",${e.timestamp}`
        );
        return header + '\n' + rows.join('\n');
    }

    // Export as JSON string
    toJSON(): string {
        return JSON.stringify(this.entries.map((e, i) => ({
            index: i + 1,
            label: e.label,
            value: e.value,
            timestamp: e.timestamp
        })), null, 2);
    }

    // Download as CSV file
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

    // Event callback registration
    onNewEntry(callback: (entry: LogEntry) => void) {
        this.callbacks.push(callback);
    }

    removeCallback(callback: (entry: LogEntry) => void) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }
}

// Register blocks
export function registerDataLoggerBlocks() {
    const newBlocks = dataLoggerBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerDataLoggerGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['logger_log'] = (block: any) => {
        const value = block.getFieldValue('VALUE') || '0';
        return `if(window.runtime?.logger) window.runtime.logger.log('${value.replace(/'/g, "\\'")}');\n`;
    };
    jsGen['logger_log_with_label'] = (block: any) => {
        const value = block.getFieldValue('VALUE') || '0';
        const label = block.getFieldValue('LABEL') || 'data';
        return `if(window.runtime?.logger) window.runtime.logger.logWithLabel('${label.replace(/'/g, "\\'")}', '${value.replace(/'/g, "\\'")}');\n`;
    };
    jsGen['logger_clear'] = () =>
        'if(window.runtime?.logger) window.runtime.logger.clear();\n';
    jsGen['logger_get_count'] = () =>
        ['window.runtime?.logger?.getCount()||0', 0];
    jsGen['logger_get_entry'] = (block: any) => {
        const idx = block.getFieldValue('INDEX') || 1;
        return [`window.runtime?.logger?.getEntry(${idx})||''`, 0];
    };
    jsGen['logger_get_label'] = (block: any) => {
        const idx = block.getFieldValue('INDEX') || 1;
        return [`window.runtime?.logger?.getLabel(${idx})||''`, 0];
    };
    jsGen['logger_save_to_csv'] = () =>
        'if(window.runtime?.logger) window.runtime.logger.saveToCSV();\n';
    jsGen['logger_on_new_entry'] = (block: any) => {
        const body = jsGen.statementToCode(block, 'BODY');
        return `if(window.runtime?.logger){window.runtime.logger.onNewEntry((_log_entry)=>{${body}});}\n`;
    };
}

// Extension configuration
export const dataLoggerExtension: ExtensionCategory = {
    id: 'data_logger',
    name: 'Data Logger',
    colour: '#FF6F00',
    icon: '📋',
    blocks: dataLoggerBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
