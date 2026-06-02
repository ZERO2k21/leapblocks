import { Extension, ExtensionInfo } from '../core/Extension';
import { DataLoggerRuntime } from './runtime';

export class DataLoggerExtension extends Extension {
    private runtime: DataLoggerRuntime;

    constructor(runtime?: DataLoggerRuntime) {
        super(runtime);
        this.runtime = runtime || new DataLoggerRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'data_logger',
            name: 'Data Logger',
            color1: '#FF6F00',
            blocks: [
                { opcode: 'logger_log', blockType: 'command', text: 'log [VALUE]', arguments: { VALUE: { type: 'string', defaultValue: '0' } } },
                { opcode: 'logger_log_with_label', blockType: 'command', text: 'log [VALUE] as [LABEL]', arguments: { VALUE: { type: 'string', defaultValue: '0' }, LABEL: { type: 'string', defaultValue: 'data' } } },
                { opcode: 'logger_clear', blockType: 'command', text: 'clear log' },
                { opcode: 'logger_get_count', blockType: 'reporter', text: 'log count' },
                { opcode: 'logger_get_entry', blockType: 'reporter', text: 'log entry [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'logger_get_label', blockType: 'reporter', text: 'label of log entry [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'logger_save_to_csv', blockType: 'command', text: 'save log as CSV' },
                { opcode: 'logger_on_new_entry', blockType: 'command', text: 'when new entry logged' },
            ]
        };
    }

    logger_log(value: string) { this.runtime.log(value); }
    logger_log_with_label(value: string, label: string) { this.runtime.logWithLabel(label, value); }
    logger_clear() { this.runtime.clear(); }
    logger_get_count() { return this.runtime.getCount(); }
    logger_get_entry(index: number) { return this.runtime.getEntry(index); }
    logger_get_label(index: number) { return this.runtime.getLabel(index); }
    logger_save_to_csv() { this.runtime.saveToCSV(); }
    logger_on_new_entry() {}
}

export const dataLoggerExtension = new DataLoggerExtension();
export { DataLoggerRuntime } from './runtime';
