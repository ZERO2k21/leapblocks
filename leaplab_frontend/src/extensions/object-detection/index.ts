import { Extension, ExtensionInfo } from '../core/Extension';
import { ObjectDetectionRuntime } from './runtime';

export class ObjectDetectionExtension extends Extension {
    private runtime: ObjectDetectionRuntime;

    constructor(runtime?: ObjectDetectionRuntime) {
        super(runtime);
        this.runtime = runtime || new ObjectDetectionRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'object_detection',
            name: 'Object Detection',
            color1: '#3dba7e',
            blocks: [
                { opcode: 'object_detect', blockType: 'command', text: 'detect objects in camera' },
                { opcode: 'object_when_detected', blockType: 'command', text: 'when [OBJECT] detected', arguments: { OBJECT: { type: 'dropdown', defaultValue: 'cat', menu: [['cat', 'cat'], ['dog', 'dog'], ['person', 'person'], ['car', 'car'], ['ball', 'ball']] } } },
                { opcode: 'object_label', blockType: 'reporter', returnType: 'String', text: 'label of object [N]', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'object_confidence', blockType: 'reporter', text: 'confidence of object [N]', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'object_x', blockType: 'reporter', text: 'x of object [N]', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'object_y', blockType: 'reporter', text: 'y of object [N]', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'object_count', blockType: 'reporter', text: 'number of objects' },
            ]
        };
    }

    object_detect() { this.runtime.detectObjects(); }
    object_when_detected(_object: string) {}
    object_label(n: number) { return this.runtime.getLabel(n); }
    object_confidence(n: number) { return this.runtime.getConfidence(n); }
    object_x(n: number) { return this.runtime.getX(n); }
    object_y(n: number) { return this.runtime.getY(n); }
    object_count() { return this.runtime.getNumberOfObjects(); }
}

export const objectDetectionExtension = new ObjectDetectionExtension();
export { ObjectDetectionRuntime } from './runtime';
