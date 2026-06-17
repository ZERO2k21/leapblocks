// Video Player Extension - Block definitions and registration
import { Extension, ExtensionInfo } from '../core/Extension';
import { VideoPlayerRuntime } from './runtime';

export class VideoPlayerExtension extends Extension {
    private runtime: VideoPlayerRuntime;

    constructor(runtime?: VideoPlayerRuntime) {
        super(runtime);
        this.runtime = runtime || new VideoPlayerRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'video_player',
            name: 'Video Player',
            color1: '#1565C0',
            blocks: [
                // Commands
                { opcode: 'video_set_source', blockType: 'command', text: 'set video to [URL]', arguments: { URL: { type: 'string', defaultValue: 'https://example.com/video.mp4' } } },
                { opcode: 'video_play', blockType: 'command', text: 'play video' },
                { opcode: 'video_pause', blockType: 'command', text: 'pause video' },
                { opcode: 'video_stop', blockType: 'command', text: 'stop video' },
                { opcode: 'video_show', blockType: 'command', text: 'show video' },
                { opcode: 'video_hide', blockType: 'command', text: 'hide video' },
                { opcode: 'video_set_speed', blockType: 'command', text: 'set video speed to [SPEED]', arguments: { SPEED: { type: 'dropdown', defaultValue: '1', menu: [['0.25x', '0.25'], ['0.5x', '0.5'], ['1x', '1'], ['1.5x', '1.5'], ['2x', '2']] } } },
                { opcode: 'video_set_volume', blockType: 'command', text: 'set video volume to [VOLUME] %', arguments: { VOLUME: { type: 'number', defaultValue: 100 } } },
                { opcode: 'video_seek', blockType: 'command', text: 'seek video to [TIME] seconds', arguments: { TIME: { type: 'number', defaultValue: 0 } } },
                { opcode: 'video_set_position', blockType: 'command', text: 'set video to x [X] y [Y] size [SIZE] %', arguments: { X: { type: 'number', defaultValue: 50 }, Y: { type: 'number', defaultValue: 50 }, SIZE: { type: 'number', defaultValue: 100 } } },
                { opcode: 'video_set_loop', blockType: 'command', text: 'loop video [LOOP]', arguments: { LOOP: { type: 'dropdown', defaultValue: 'off', menu: [['on', 'on'], ['off', 'off']] } } },
                // Reporters
                { opcode: 'video_get_time', blockType: 'reporter', text: 'current time' },
                { opcode: 'video_get_duration', blockType: 'reporter', text: 'video duration' },
                { opcode: 'video_is_playing', blockType: 'Boolean', text: 'is video playing' },
                { opcode: 'video_is_loaded', blockType: 'Boolean', text: 'is video loaded' },
                { opcode: 'video_get_percent', blockType: 'reporter', text: 'video progress %' },
                { opcode: 'video_get_source', blockType: 'reporter', returnType: 'String', text: 'video source' },
            ]
        };
    }

    // ── Command handlers ────────────────────────────────────────────────
    video_set_source(url: string) { this.runtime.setSource(url); }
    video_play() { this.runtime.play(); }
    video_pause() { this.runtime.pause(); }
    video_stop() { this.runtime.stop(); }
    video_show() { this.runtime.show(); }
    video_hide() { this.runtime.hide(); }
    video_set_speed(speed: string) { this.runtime.setSpeed(Number(speed)); }
    video_set_volume(volume: number) { this.runtime.setVolume(volume); }
    video_seek(time: number) { this.runtime.seek(time); }
    video_set_position(x: number, y: number, size: number) { this.runtime.setPosition(x, y, size); }
    video_set_loop(loop: string) { this.runtime.setLoop(loop === 'on'); }

    // ── Reporter handlers ───────────────────────────────────────────────
    video_get_time() { return this.runtime.getCurrentTime(); }
    video_get_duration() { return this.runtime.getDuration(); }
    video_is_playing() { return this.runtime.isPlaying(); }
    video_is_loaded() { return this.runtime.isLoaded(); }
    video_get_percent() { return this.runtime.getPercent(); }
    video_get_source() { return this.runtime.getSource(); }
}

export const videoPlayerExtension = new VideoPlayerExtension();
export { VideoPlayerRuntime } from './runtime';
