import { Extension, ExtensionInfo } from '../core/Extension';
import { VideoSensingRuntime } from './runtime';

export class VideoSensingExtension extends Extension {
    private runtime: VideoSensingRuntime;

    constructor(runtime?: VideoSensingRuntime) {
        super(runtime);
        this.runtime = runtime || new VideoSensingRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'video_sensing',
            name: 'Video Sensing',
            color1: '#1565C0',
            blocks: [
                { opcode: 'video_set_sensitivity', blockType: 'command', text: 'set motion sensitivity to [THRESHOLD]', arguments: { THRESHOLD: { type: 'number', defaultValue: 30 } } },
                { opcode: 'video_sense_motion', blockType: 'Boolean', text: 'motion detected?' },
                { opcode: 'video_motion_level', blockType: 'reporter', text: 'motion level' },
                { opcode: 'video_sense_direction', blockType: 'reporter', text: 'motion direction' },
            ]
        };
    }

    video_set_sensitivity(threshold: number) { this.runtime.setSensitivity(threshold); }
    video_sense_motion() { return this.runtime.isMotionDetected(); }
    video_motion_level() { return this.runtime.getMotionLevel(); }
    video_sense_direction() { return this.runtime.getDirection(); }
}

export const videoSensingExtension = new VideoSensingExtension();
export { VideoSensingRuntime } from './runtime';
