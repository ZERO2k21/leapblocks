import { Extension, ExtensionInfo } from '../core/Extension';
import { VisionRuntime } from './runtime';

export class ComputerVisionExtension extends Extension {
    private runtime: VisionRuntime;

    constructor(runtime?: VisionRuntime) {
        super(runtime);
        this.runtime = runtime || new VisionRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'computer_vision',
            name: 'Computer Vision',
            color1: '#00897B',
            blocks: [
                { opcode: 'vision_camera_on', blockType: 'command', text: 'camera on' },
                { opcode: 'vision_camera_off', blockType: 'command', text: 'camera off' },
                { opcode: 'vision_analyze', blockType: 'command', text: 'analyze frame' },
                { opcode: 'vision_detect_objects', blockType: 'command', text: 'detect objects' },
                { opcode: 'vision_get_object_count', blockType: 'reporter', text: 'object count' },
                { opcode: 'vision_get_object_name', blockType: 'reporter', text: 'name of object [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'vision_get_object_confidence', blockType: 'reporter', text: 'confidence of object [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'vision_get_object_x', blockType: 'reporter', text: 'x of object [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'vision_get_object_y', blockType: 'reporter', text: 'y of object [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
                { opcode: 'vision_is_object_present', blockType: 'Boolean', text: 'is [NAME] present', arguments: { NAME: { type: 'string', defaultValue: 'person' } } },
                { opcode: 'vision_draw_bounding_boxes', blockType: 'command', text: 'bounding boxes [STATE]', arguments: { STATE: { type: 'dropdown', defaultValue: 'on', menu: [['on', 'on'], ['off', 'off']] } } },
                { opcode: 'vision_get_face_count', blockType: 'reporter', text: 'face count' },
                { opcode: 'vision_get_emotion', blockType: 'reporter', text: 'emotion of face [INDEX]', arguments: { INDEX: { type: 'number', defaultValue: 1 } } },
            ]
        };
    }

    vision_camera_on() { this.runtime.cameraOn_(); }
    vision_camera_off() { this.runtime.cameraOff(); }
    vision_analyze() { return this.runtime.analyze(); }
    vision_detect_objects() { return this.runtime.detectObjects(); }
    vision_get_object_count() { return this.runtime.getObjectCount(); }
    vision_get_object_name(index: number) { return this.runtime.getObjectName(index); }
    vision_get_object_confidence(index: number) { return this.runtime.getObjectConfidence(index); }
    vision_get_object_x(index: number) { return this.runtime.getObjectX(index); }
    vision_get_object_y(index: number) { return this.runtime.getObjectY(index); }
    vision_is_object_present(name: string) { return this.runtime.isObjectPresent(name); }
    vision_draw_bounding_boxes(state: string) { this.runtime.setBoundingBoxes(state); }
    vision_get_face_count() { return this.runtime.getFaceCount(); }
    vision_get_emotion(index: number) { return this.runtime.getEmotion(index); }
}

export const computerVisionExtension = new ComputerVisionExtension();
export { VisionRuntime } from './runtime';
