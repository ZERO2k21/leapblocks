import { Extension, ExtensionInfo } from '../core/Extension';

export class HandPoseExtension extends Extension {
    getInfo(): ExtensionInfo {
        return {
            id: 'hand_pose',
            name: 'Hand Pose',
            color1: '#D43D41',
            blocks: [
                { opcode: 'hp_camera', blockType: 'command', text: 'camera [ACTION]', arguments: { ACTION: { type: 'dropdown', defaultValue: 'on', menu: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] } } },
                { opcode: 'hp_analyze', blockType: 'command', text: '[ACTION] hand', arguments: { ACTION: { type: 'dropdown', defaultValue: 'analyze', menu: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] } } },
                { opcode: 'hp_move_with', blockType: 'command', text: 'move sprite with [FINGER]', arguments: { FINGER: { type: 'dropdown', defaultValue: 'thumb', menu: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] } } },
                { opcode: 'hp_guess_sign', blockType: 'command', text: 'guess sign' },
                { opcode: 'hp_when_sign', blockType: 'hat', text: 'when hand sign [SIGN]', arguments: { SIGN: { type: 'dropdown', defaultValue: '2', menu: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up'], ['No Hand', 'no_hand']] } } },
                { opcode: 'hp_finger_x', blockType: 'reporter', text: '[FINGER] x position', arguments: { FINGER: { type: 'dropdown', defaultValue: 'thumb', menu: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] } } },
                { opcode: 'hp_finger_y', blockType: 'reporter', text: '[FINGER] y position', arguments: { FINGER: { type: 'dropdown', defaultValue: 'thumb', menu: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] } } },
            ]
        };
    }

    hp_camera(action: string) { (window as any).runtime?.handPose?.analyse(action); }
    hp_analyze(action: string) { (window as any).runtime?.handPose?.analyse(action); }
    hp_move_with(finger: string) { (window as any).runtime?.handPose?.moveSpriteToFinger(finger); }
    hp_guess_sign() {
        const s = (window as any).__activeSpriteId;
        if (s && (window as any).spriteManager) (window as any).spriteManager.getSprite(s)?.say('Sign: ' + (window as any).runtime?.handPose?.getSign());
    }
    hp_when_sign() {}
    hp_finger_x(finger: string) { return (window as any).runtime?.handPose?.getLandmarkX(finger) || 0; }
    hp_finger_y(finger: string) { return (window as any).runtime?.handPose?.getLandmarkY(finger) || 0; }
}

export const handPoseExtension = new HandPoseExtension();
