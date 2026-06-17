import { Extension, ExtensionInfo } from '../core/Extension';

export class HumanBodyExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'human_body',
            name: 'Human Body Detection',
            color1: '#D43D41',
            blocks: [
                { opcode: 'bd_camera', blockType: 'command', text: 'camera [STATE]', arguments: { STATE: { type: 'dropdown', defaultValue: 'on', menu: [['on', 'on'], ['off', 'off']] } } },
                { opcode: 'bd_analyze', blockType: 'command', text: 'detect body pose' },
                { opcode: 'bd_body_count', blockType: 'reporter', text: 'body count' },
                { opcode: 'bd_get_x', blockType: 'reporter', text: 'x position of [PART] of body [BODY]', arguments: { PART: { type: 'dropdown', defaultValue: 'nose', menu: [['nose', 'nose'], ['left eye', 'left_eye'], ['right eye', 'right_eye'], ['left ear', 'left_ear'], ['right ear', 'right_ear'], ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder'], ['left elbow', 'left_elbow'], ['right elbow', 'right_elbow'], ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'], ['left hip', 'left_hip'], ['right hip', 'right_hip'], ['left knee', 'left_knee'], ['right knee', 'right_knee'], ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']] }, BODY: { type: 'number', defaultValue: 1 } } },
                { opcode: 'bd_get_y', blockType: 'reporter', text: 'y position of [PART] of body [BODY]', arguments: { PART: { type: 'dropdown', defaultValue: 'nose', menu: [['nose', 'nose'], ['left eye', 'left_eye'], ['right eye', 'right_eye'], ['left ear', 'left_ear'], ['right ear', 'right_ear'], ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder'], ['left elbow', 'left_elbow'], ['right elbow', 'right_elbow'], ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'], ['left hip', 'left_hip'], ['right hip', 'right_hip'], ['left knee', 'left_knee'], ['right knee', 'right_knee'], ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']] }, BODY: { type: 'number', defaultValue: 1 } } },
                { opcode: 'bd_is_part_visible', blockType: 'Boolean', text: 'is [PART] of body [BODY] visible?', arguments: { PART: { type: 'dropdown', defaultValue: 'nose', menu: [['nose', 'nose'], ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'], ['left knee', 'left_knee'], ['right knee', 'right_knee'], ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']] }, BODY: { type: 'number', defaultValue: 1 } } },
            ]
        };
    }

    bd_camera(state: string) { (window as any).runtime?.bodyDetection?.setCameraOn(state); }
    bd_analyze() { (window as any).runtime?.bodyDetection?.analyse('analyze'); }
    bd_body_count() { return (window as any).runtime?.bodyDetection?.getBodyCount() || 0; }
    bd_get_x(part: string, body: number) { return (window as any).runtime?.bodyDetection?.getX(part, body) || 0; }
    bd_get_y(part: string, body: number) { return (window as any).runtime?.bodyDetection?.getY(part, body) || 0; }
    bd_is_part_visible(part: string, body: number) {
        return ((window as any).runtime?.bodyDetection?.getX(part, body) !== 0 ||
                (window as any).runtime?.bodyDetection?.getY(part, body) !== 0);
    }
}

export const humanBodyExtension = new HumanBodyExtension();
