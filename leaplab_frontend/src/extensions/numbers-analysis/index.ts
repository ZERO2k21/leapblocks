import { Extension, ExtensionInfo } from '../core/Extension';

export class NumbersAnalysisExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'numbers_analysis',
            name: 'Numbers Analysis',
            color1: '#630ed4',
            blocks: [
                { opcode: 'set_value', blockType: 'command', text: 'set [NAME] to [VALUE]', arguments: { NAME: { type: 'string', defaultValue: 'feature1' }, VALUE: { type: 'number', defaultValue: '0' } } },
                { opcode: 'analyse_numbers', blockType: 'reporter', returnType: 'String', text: 'analyse numbers' },
                { opcode: 'get_prediction', blockType: 'reporter', returnType: 'String', text: 'prediction' },
                { opcode: 'get_confidence', blockType: 'reporter', text: 'confidence' },
                { opcode: 'is_trained', blockType: 'Boolean', text: 'model trained?' },
                { opcode: 'set_input', blockType: 'command', text: 'set input [NAME] to [VALUE]', arguments: { NAME: { type: 'string', defaultValue: 'input1' }, VALUE: { type: 'number', defaultValue: '0' } } },
                { opcode: 'get_output', blockType: 'reporter', returnType: 'String', text: 'output [NAME]', arguments: { NAME: { type: 'string', defaultValue: 'result' } } },
            ]
        };
    }

    set_value(name: string, value: string) {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) rt.setValue(name, Number(value));
    }

    analyse_numbers() {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) return rt.analyse();
        return 'not trained';
    }

    get_prediction() {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) return rt.getPrediction() || 'none';
        return 'none';
    }

    get_confidence() {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) return rt.getConfidence() || 0;
        return 0;
    }

    is_trained() {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) return rt.isTrained();
        return false;
    }

    set_input(name: string, value: string) {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) rt.setInput(name, Number(value));
    }

    get_output(name: string) {
        const rt = (window as any).runtime?.numbersAnalysis;
        if (rt) return rt.getOutput(name) || '';
        return '';
    }
}

export const numbersAnalysisExtension = new NumbersAnalysisExtension();
