import { Extension, ExtensionInfo } from '../core/Extension';

export class FaceDetectionExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'face_detection',
            name: 'Face Detection',
            color1: '#D43D41',
            blocks: [
                { opcode: 'fd_video_on_stage', blockType: 'command', text: 'turn [STATE] video on stage with [TRANSPARENCY] % transparency', arguments: { STATE: { type: 'dropdown', defaultValue: 'on', menu: [['on', 'on'], ['off', 'off']] }, TRANSPARENCY: { type: 'number', defaultValue: 0 } } },
                { opcode: 'fd_show_bounding_box', blockType: 'command', text: '[STATE] bounding box', arguments: { STATE: { type: 'dropdown', defaultValue: 'show', menu: [['show', 'show'], ['hide', 'hide']] } } },
                { opcode: 'fd_set_threshold', blockType: 'command', text: 'set detection threshold to [THRESHOLD]', arguments: { THRESHOLD: { type: 'dropdown', defaultValue: '0.5', menu: [['0.5', '0.5'], ['0.6', '0.6'], ['0.7', '0.7'], ['0.8', '0.8'], ['0.9', '0.9']] } } },
                { opcode: 'fd_analyse_image', blockType: 'command', text: 'analyse image from [SOURCE]', arguments: { SOURCE: { type: 'dropdown', defaultValue: 'camera', menu: [['camera', 'camera'], ['image', 'image']] } } },
                { opcode: 'fd_get_num_faces', blockType: 'command', text: 'get # faces' },
                { opcode: 'fd_get_expression', blockType: 'reporter', returnType: 'String', text: 'get expression of face [N]', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_get_dimension', blockType: 'reporter', text: 'get [DIM] of face [N]', arguments: { DIM: { type: 'dropdown', defaultValue: 'width', menu: [['width', 'width'], ['height', 'height']] }, N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_is_expression', blockType: 'Boolean', text: 'is expression of face [N] [EXPRESSION]', arguments: { N: { type: 'number', defaultValue: 1 }, EXPRESSION: { type: 'dropdown', defaultValue: 'happy', menu: [['happy', 'happy'], ['sad', 'sad'], ['angry', 'angry'], ['surprised', 'surprised'], ['neutral', 'neutral']] } } },
                { opcode: 'fd_get_xy_position', blockType: 'reporter', text: 'get [AXIS] position of face [N]', arguments: { AXIS: { type: 'dropdown', defaultValue: 'x', menu: [['x', 'x'], ['y', 'y']] }, N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_get_landmark_pos', blockType: 'reporter', text: 'get [AXIS] position of [LANDMARK] of face [N]', arguments: { AXIS: { type: 'dropdown', defaultValue: 'x', menu: [['x', 'x'], ['y', 'y']] }, LANDMARK: { type: 'dropdown', defaultValue: 'left_eye', menu: [['left eye', 'left_eye'], ['right eye', 'right_eye'], ['nose', 'nose'], ['mouth', 'mouth'], ['left ear', 'left_ear'], ['right ear', 'right_ear']] }, N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_get_landmark_num', blockType: 'reporter', text: 'get [AXIS] position of landmark [LANDMARK_N] of face [N]', arguments: { AXIS: { type: 'dropdown', defaultValue: 'x', menu: [['x', 'x'], ['y', 'y']] }, LANDMARK_N: { type: 'number', defaultValue: 1 }, N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_face_count', blockType: 'reporter', text: 'face count' },
                { opcode: 'fd_emotion', blockType: 'reporter', returnType: 'String', text: 'emotion' },
                { opcode: 'fd_face_x', blockType: 'reporter', text: 'face [N] x position', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_face_y', blockType: 'reporter', text: 'face [N] y position', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_add_class', blockType: 'command', text: 'add class [CLASS_N] as [CLASS_NAME] from [SOURCE]', arguments: { CLASS_N: { type: 'number', defaultValue: 1 }, CLASS_NAME: { type: 'string', defaultValue: 'Jarvis' }, SOURCE: { type: 'dropdown', defaultValue: 'camera', menu: [['camera', 'camera'], ['image', 'image']] } } },
                { opcode: 'fd_reset_class', blockType: 'command', text: 'reset class' },
                { opcode: 'fd_do_face_matching', blockType: 'command', text: 'do face matching on [SOURCE]', arguments: { SOURCE: { type: 'dropdown', defaultValue: 'camera', menu: [['camera', 'camera'], ['image', 'image']] } } },
                { opcode: 'fd_is_class_detected', blockType: 'Boolean', text: 'is [CLASS_N] class detected', arguments: { CLASS_N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_get_class_detected', blockType: 'reporter', returnType: 'String', text: 'get class of face [N] detected', arguments: { N: { type: 'number', defaultValue: 1 } } },
                { opcode: 'fd_camera', blockType: 'command', text: 'camera [ACTION]', arguments: { ACTION: { type: 'dropdown', defaultValue: 'on', menu: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] } } },
                { opcode: 'fd_analyze', blockType: 'command', text: '[ACTION] face', arguments: { ACTION: { type: 'dropdown', defaultValue: 'analyze', menu: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] } } },
            ]
        };
    }

    fd_video_on_stage(state: string, transparency: number) {
        if ((window as any).__setCameraOn) (window as any).__setCameraOn(state === 'on');
        (window as any).runtime?.face?.setVideoTransparency?.(transparency);
    }
    fd_show_bounding_box(state: string) { (window as any).runtime?.face?.setBoundingBox?.(state); }
    fd_set_threshold(threshold: string) { (window as any).runtime?.face?.setThreshold?.(Number(threshold)); }
    fd_analyse_image(source: string) {
        if ((window as any).__setCameraOn) (window as any).__setCameraOn(source === 'camera');
        (window as any).runtime?.face?.analyse('analyze');
    }
    fd_get_num_faces() {
        const _s = (window as any).__activeSpriteId;
        if (_s && (window as any).spriteManager) (window as any).spriteManager.getSprite(_s)?.say((window as any).runtime?.face?.getFaceCount() + ' faces');
    }
    fd_get_expression(n: number) { return (window as any).runtime?.face?.getEmotion() || ''; }
    fd_get_dimension(dim: string, n: number) {
        const method = dim === 'width' ? 'getWidth' : 'getHeight';
        return (window as any).runtime?.face?.[method]?.(n) || 0;
    }
    fd_is_expression(n: number, expression: string) { return ((window as any).runtime?.face?.getEmotion() || '').toLowerCase() === expression; }
    fd_get_xy_position(axis: string, n: number) { return (window as any).runtime?.face?.[`get${axis.toUpperCase()}`]?.(n) || 0; }
    fd_get_landmark_pos(axis: string, landmark: string, n: number) { return (window as any).runtime?.face?.getLandmark?.(landmark, n, axis) || 0; }
    fd_get_landmark_num(axis: string, landmarkN: number, n: number) { return (window as any).runtime?.face?.getLandmarkByIndex?.(landmarkN, n, axis) || 0; }
    fd_face_count() { return (window as any).runtime?.face?.getFaceCount() || 0; }
    fd_emotion() { return (window as any).runtime?.face?.getEmotion() || ''; }
    fd_face_x(n: number) { return (window as any).runtime?.face?.getX(n) || 0; }
    fd_face_y(n: number) { return (window as any).runtime?.face?.getY(n) || 0; }
    fd_add_class(classN: number, className: string, source: string) { (window as any).runtime?.face?.addClass?.(classN, className, source); }
    fd_reset_class() { (window as any).runtime?.face?.resetClasses?.(); }
    fd_do_face_matching(source: string) { return (window as any).runtime?.face?.doFaceMatching?.(source); }
    fd_is_class_detected(classN: number) { return (window as any).runtime?.face?.isClassDetected?.(classN) || false; }
    fd_get_class_detected(n: number) { return (window as any).runtime?.face?.getClassOfFace?.(n) || ''; }
    fd_camera(action: string) {
        if ((window as any).__setCameraOn) (window as any).__setCameraOn(action === 'on');
        (window as any).runtime?.face?.analyse(action);
    }
    fd_analyze(action: string) { (window as any).runtime?.face?.analyse(action); }
}

export const faceDetectionExtension = new FaceDetectionExtension();
