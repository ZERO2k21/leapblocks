// VideoPlayer.ts - Video playback blocks using HTML5 <video> element
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. User adds Video Player extension from the Extension Library
// 2. Blocks appear in the toolbox under "Video Player"
// 3. User drags "set video to URL" + "play video" blocks
// 4. Video element overlays the stage canvas (below sprites, above background)
// 5. Reporter blocks (current time, duration, is playing) return live values
// 6. Sprites react in real-time via forever loops
//
// SOURCE SUPPORT:
// ─────────────────────────────────────────────────────────────────────────────
// - HTTP/HTTPS URLs (e.g. "https://example.com/video.mp4")
// - Data URIs (base64 encoded videos)
// - Blob URLs (from file uploads)
// - Local file paths (Electron .exe mode)
//
// STAGE INTEGRATION:
// ─────────────────────────────────────────────────────────────────────────────
// The video element is rendered in Stage.tsx as a new layer between
// the camera overlay and the main canvas. The runtime controls its
// visibility, source, and playback state.

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const videoPlayerBlocks = [
    // ── Statement blocks (actions) ──────────────────────────────────────
    {
        type: 'video_set_source',
        message0: 'set video to %1',
        args0: [{ type: 'field_input', name: 'URL', text: 'https://example.com/video.mp4' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Set the video source URL (HTTP, data URI, or blob URL)',
        helpUrl: ''
    },
    {
        type: 'video_play',
        message0: 'play video',
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Start playing the video',
        helpUrl: ''
    },
    {
        type: 'video_pause',
        message0: 'pause video',
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Pause the video',
        helpUrl: ''
    },
    {
        type: 'video_stop',
        message0: 'stop video',
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Stop the video and reset to beginning',
        helpUrl: ''
    },
    {
        type: 'video_show',
        message0: 'show video',
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Show the video overlay on stage',
        helpUrl: ''
    },
    {
        type: 'video_hide',
        message0: 'hide video',
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Hide the video overlay from stage',
        helpUrl: ''
    },
    {
        type: 'video_set_speed',
        message0: 'set video speed to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SPEED',
            options: [
                ['0.25x', '0.25'],
                ['0.5x', '0.5'],
                ['1x (normal)', '1'],
                ['1.5x', '1.5'],
                ['2x', '2']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Set the video playback speed',
        helpUrl: ''
    },
    {
        type: 'video_set_volume',
        message0: 'set video volume to %1 %',
        args0: [{ type: 'field_number', name: 'VOLUME', value: 100, min: 0, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Set the video volume (0-100%)',
        helpUrl: ''
    },
    {
        type: 'video_seek',
        message0: 'seek video to %1 seconds',
        args0: [{ type: 'field_number', name: 'TIME', value: 0, min: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Seek the video to a specific time in seconds',
        helpUrl: ''
    },
    {
        type: 'video_set_position',
        message0: 'set video to x %1 y %2 size %3 %',
        args0: [
            { type: 'field_number', name: 'X', value: 50, min: 0, max: 100 },
            { type: 'field_number', name: 'Y', value: 50, min: 0, max: 100 },
            { type: 'field_number', name: 'SIZE', value: 100, min: 10, max: 200 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Position and size the video on stage (x,y as %, size as %)',
        helpUrl: ''
    },
    {
        type: 'video_set_loop',
        message0: 'loop video %1',
        args0: [{
            type: 'field_dropdown',
            name: 'LOOP',
            options: [
                ['on', 'on'],
                ['off', 'off']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Enable or disable video looping',
        helpUrl: ''
    },

    // ── Reporter blocks (value return) ──────────────────────────────────
    {
        type: 'video_get_time',
        message0: 'current time',
        output: 'Number',
        colour: '#0D47A1',
        tooltip: 'Returns the current playback time in seconds',
        helpUrl: ''
    },
    {
        type: 'video_get_duration',
        message0: 'video duration',
        output: 'Number',
        colour: '#0D47A1',
        tooltip: 'Returns the total duration of the video in seconds',
        helpUrl: ''
    },
    {
        type: 'video_is_playing',
        message0: 'is video playing',
        output: 'Boolean',
        colour: '#0D47A1',
        tooltip: 'Returns true if the video is currently playing',
        helpUrl: ''
    },
    {
        type: 'video_is_loaded',
        message0: 'is video loaded',
        output: 'Boolean',
        colour: '#0D47A1',
        tooltip: 'Returns true if the video has loaded enough to play',
        helpUrl: ''
    },
    {
        type: 'video_get_percent',
        message0: 'video progress %',
        output: 'Number',
        colour: '#0D47A1',
        tooltip: 'Returns the playback progress as a percentage (0-100)',
        helpUrl: ''
    },
    {
        type: 'video_get_source',
        message0: 'video source',
        output: 'String',
        colour: '#0D47A1',
        tooltip: 'Returns the current video source URL',
        helpUrl: ''
    }
];

// Runtime implementation
export class VideoPlayerRuntime {
    private videoEl: HTMLVideoElement | null = null;
    private containerEl: HTMLDivElement | null = null;
    private _isShowing = false;
    private _loop = false;

    /**
     * Connect the HTML video element (called from Stage.tsx).
     * Creates both the container div and the video element.
     */
    setVideoElement(video: HTMLVideoElement | null, container?: HTMLDivElement | null) {
        this.videoEl = video;
        if (container) this.containerEl = container;
        if (video) {
            video.loop = this._loop;
        }
    }

    /**
     * Get the video element, creating one if needed.
     */
    private ensureVideo(): HTMLVideoElement | null {
        if (this.videoEl) return this.videoEl;

        // Create elements on demand if Stage hasn't provided them yet
        if (typeof document !== 'undefined') {
            const container = document.getElementById('video-playback-container');
            const video = document.getElementById('video-playback') as HTMLVideoElement;
            if (video) {
                this.videoEl = video;
                this.containerEl = container as HTMLDivElement;
                video.loop = this._loop;
                return video;
            }
        }
        return null;
    }

    // ── Playback controls ───────────────────────────────────────────────

    setSource(url: string) {
        const video = this.ensureVideo();
        if (!video) {
            console.warn('[VideoPlayer] No video element available');
            return;
        }
        video.src = url;
        video.load();
        console.log(`[VideoPlayer] Source set: ${url}`);
    }

    play() {
        const video = this.ensureVideo();
        if (!video) return;
        video.play().catch(err => {
            console.warn('[VideoPlayer] Play failed:', err.message);
        });
        console.log('[VideoPlayer] Playing');
    }

    pause() {
        const video = this.ensureVideo();
        if (!video) return;
        video.pause();
        console.log('[VideoPlayer] Paused');
    }

    stop() {
        const video = this.ensureVideo();
        if (!video) return;
        video.pause();
        video.currentTime = 0;
        console.log('[VideoPlayer] Stopped');
    }

    // ── Visibility ──────────────────────────────────────────────────────

    show() {
        this._isShowing = true;
        if (this.containerEl) {
            this.containerEl.style.display = 'block';
        }
        console.log('[VideoPlayer] Shown');
    }

    hide() {
        this._isShowing = false;
        if (this.containerEl) {
            this.containerEl.style.display = 'none';
        }
        console.log('[VideoPlayer] Hidden');
    }

    isShowing(): boolean {
        return this._isShowing;
    }

    // ── Playback settings ───────────────────────────────────────────────

    setSpeed(speed: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.playbackRate = Math.max(0.25, Math.min(4, speed));
        console.log(`[VideoPlayer] Speed: ${speed}x`);
    }

    setVolume(percent: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.volume = Math.max(0, Math.min(1, percent / 100));
        console.log(`[VideoPlayer] Volume: ${percent}%`);
    }

    seek(timeSec: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.duration || 0, timeSec));
        console.log(`[VideoPlayer] Seeked to ${timeSec}s`);
    }

    setLoop(enabled: boolean) {
        this._loop = enabled;
        if (this.videoEl) {
            this.videoEl.loop = enabled;
        }
        console.log(`[VideoPlayer] Loop: ${enabled}`);
    }

    setPosition(xPercent: number, yPercent: number, sizePercent: number) {
        if (!this.containerEl) return;
        const w = sizePercent / 100 * 100;
        const h = sizePercent / 100 * 100;
        this.containerEl.style.left = `${xPercent}%`;
        this.containerEl.style.top = `${yPercent}%`;
        this.containerEl.style.width = `${w}%`;
        this.containerEl.style.height = `${h}%`;
        this.containerEl.style.transform = 'translate(-50%, -50%)';
        console.log(`[VideoPlayer] Position: ${xPercent}%, ${yPercent}%, size: ${sizePercent}%`);
    }

    // ── Reporters ───────────────────────────────────────────────────────

    getCurrentTime(): number {
        return this.videoEl?.currentTime ?? 0;
    }

    getDuration(): number {
        return this.videoEl?.duration ?? 0;
    }

    isPlaying(): boolean {
        return this.videoEl ? !this.videoEl.paused && !this.videoEl.ended : false;
    }

    isLoaded(): boolean {
        if (!this.videoEl) return false;
        return this.videoEl.readyState >= 2; // HAVE_CURRENT_DATA
    }

    getPercent(): number {
        if (!this.videoEl || !this.videoEl.duration) return 0;
        return (this.videoEl.currentTime / this.videoEl.duration) * 100;
    }

    getSource(): string {
        return this.videoEl?.src ?? '';
    }
}

// Register blocks
export function registerVideoPlayerBlocks() {
    const newBlocks = videoPlayerBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerVideoPlayerGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    // Statement blocks
    jsGen['video_set_source'] = (block: any) => {
        const url = block.getFieldValue('URL') || '';
        return `if(window.runtime?.video) window.runtime.video.setSource('${url.replace(/'/g, "\\'")}');\n`;
    };
    jsGen['video_play'] = () =>
        'if(window.runtime?.video) window.runtime.video.play();\n';
    jsGen['video_pause'] = () =>
        'if(window.runtime?.video) window.runtime.video.pause();\n';
    jsGen['video_stop'] = () =>
        'if(window.runtime?.video) window.runtime.video.stop();\n';
    jsGen['video_show'] = () =>
        'if(window.runtime?.video) window.runtime.video.show();\n';
    jsGen['video_hide'] = () =>
        'if(window.runtime?.video) window.runtime.video.hide();\n';
    jsGen['video_set_speed'] = (block: any) => {
        const speed = block.getFieldValue('SPEED') || '1';
        return `if(window.runtime?.video) window.runtime.video.setSpeed(${speed});\n`;
    };
    jsGen['video_set_volume'] = (block: any) => {
        const vol = block.getFieldValue('VOLUME') || 100;
        return `if(window.runtime?.video) window.runtime.video.setVolume(${vol});\n`;
    };
    jsGen['video_seek'] = (block: any) => {
        const time = block.getFieldValue('TIME') || 0;
        return `if(window.runtime?.video) window.runtime.video.seek(${time});\n`;
    };
    jsGen['video_set_position'] = (block: any) => {
        const x = block.getFieldValue('X') || 50;
        const y = block.getFieldValue('Y') || 50;
        const size = block.getFieldValue('SIZE') || 100;
        return `if(window.runtime?.video) window.runtime.video.setPosition(${x}, ${y}, ${size});\n`;
    };
    jsGen['video_set_loop'] = (block: any) => {
        const loop = block.getFieldValue('LOOP') || 'off';
        return `if(window.runtime?.video) window.runtime.video.setLoop('${loop}'==='on');\n`;
    };

    // Reporter blocks
    jsGen['video_get_time'] = () =>
        ['window.runtime?.video?.getCurrentTime()||0', 0];
    jsGen['video_get_duration'] = () =>
        ['window.runtime?.video?.getDuration()||0', 0];
    jsGen['video_is_playing'] = () =>
        ['window.runtime?.video?.isPlaying()||false', 0];
    jsGen['video_is_loaded'] = () =>
        ['window.runtime?.video?.isLoaded()||false', 0];
    jsGen['video_get_percent'] = () =>
        ['window.runtime?.video?.getPercent()||0', 0];
    jsGen['video_get_source'] = () =>
        ['window.runtime?.video?.getSource()||""', 0];
}

// Extension configuration
export const videoPlayerExtension: ExtensionCategory = {
    id: 'video_player',
    name: 'Video Player',
    colour: '#1565C0',
    icon: '🎬',
    blocks: videoPlayerBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
