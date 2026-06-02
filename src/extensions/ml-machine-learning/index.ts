import { Extension, ExtensionInfo } from '../core/Extension';

export class MLEnvironmentExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'ml_machine_learning',
            name: 'ML Environment',
            color1: '#D43D41',
            blocks: [
                { opcode: 'ml_add_sample', blockType: 'command', text: 'add camera sample as [LABEL]', arguments: { LABEL: { type: 'string', defaultValue: 'class1' } } },
                { opcode: 'ml_train', blockType: 'command', text: 'train model' },
                { opcode: 'ml_clear_all', blockType: 'command', text: 'clear all samples' },
                { opcode: 'ml_clear_class', blockType: 'command', text: 'clear samples of [LABEL]', arguments: { LABEL: { type: 'string', defaultValue: 'class1' } } },
                { opcode: 'ml_analyze', blockType: 'command', text: '[ACTION] classification', arguments: { ACTION: { type: 'dropdown', defaultValue: 'on', menu: [['start', 'on'], ['stop', 'off']] } } },
                { opcode: 'ml_get_prediction', blockType: 'reporter', text: 'prediction' },
                { opcode: 'ml_get_confidence', blockType: 'reporter', text: 'confidence' },
                { opcode: 'ml_is_class', blockType: 'Boolean', text: 'prediction is [CLASS]?', arguments: { CLASS: { type: 'string', defaultValue: 'class1' } } },
                { opcode: 'ml_get_class_count', blockType: 'reporter', text: 'number of classes' },
                { opcode: 'ml_get_sample_count', blockType: 'reporter', text: 'sample count of [LABEL]', arguments: { LABEL: { type: 'string', defaultValue: 'class1' } } },
                { opcode: 'ml_is_trained', blockType: 'Boolean', text: 'model trained?' },
            ]
        };
    }

    ml_add_sample(label: string) { return (window as any).runtime?.ml?.addSample(label); }
    ml_train() { (window as any).runtime?.ml?.train(); }
    ml_clear_all() { (window as any).runtime?.ml?.clearAll(); }
    ml_clear_class(label: string) { (window as any).runtime?.ml?.clearClass(label); }
    ml_analyze(action: string) { (window as any).runtime?.ml?.analyse(action); }
    ml_get_prediction() { return (window as any).runtime?.ml?.getPrediction() || 'none'; }
    ml_get_confidence() { return (window as any).runtime?.ml?.getConfidence() || 0; }
    ml_is_class(cls: string) { return (window as any).runtime?.ml?.isClass(cls); }
    ml_get_class_count() { return (window as any).runtime?.ml?.getClassCount() || 0; }
    ml_get_sample_count(label: string) { return (window as any).runtime?.ml?.getSampleCount(label) || 0; }
    ml_is_trained() { return (window as any).runtime?.ml?.isTrained(); }
}

export const mlEnvironmentExtension = new MLEnvironmentExtension();
