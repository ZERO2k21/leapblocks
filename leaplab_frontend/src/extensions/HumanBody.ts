// HumanBody.ts - Human body pose detection using MoveNet
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. bd_camera:       Turn camera on/off for body detection
// 2. bd_analyze:      Run MoveNet pose detection on current frame
// 3. bd_body_count:   Get number of people detected
// 4. bd_get_x:        Get X position of a body part
// 5. bd_get_y:        Get Y position of a body part
// 6. bd_is_part_visible: Check if a body part is detected

import Blockly from '@blockly-runtime';

type BodyPart = 'nose' | 'left_eye' | 'right_eye' | 'left_ear' | 'right_ear' |
    'left_shoulder' | 'right_shoulder' | 'left_elbow' | 'right_elbow' |
    'left_wrist' | 'right_wrist' | 'left_hip' | 'right_hip' |
    'left_knee' | 'right_knee' | 'left_ankle' | 'right_ankle';

export class HumanBodyRuntime {
    private _stream: MediaStream | null = null;
    private _video: HTMLVideoElement | null = null;
    private _analyzing = false;
    private _poses: any[] = [];
    private _detector: any = null;

    // MoveNet keypoint indices
    private static KEYPOINT_MAP: Record<BodyPart, number> = {
        'nose': 0,
        'left_eye': 1,
        'right_eye': 2,
        'left_ear': 3,
        'right_ear': 4,
        'left_shoulder': 5,
        'right_shoulder': 6,
        'left_elbow': 7,
        'right_elbow': 8,
        'left_wrist': 9,
        'right_wrist': 10,
        'left_hip': 11,
        'right_hip': 12,
        'left_knee': 13,
        'right_knee': 14,
        'left_ankle': 15,
        'right_ankle': 16,
    };

    async setCameraOn(state: string): Promise<void> {
        if (state === 'on') {
            await this.startCamera();
        } else {
            this.stopCamera();
        }
    }

    private async startCamera(): Promise<void> {
        if (this._stream) return;

        try {
            this._stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            this._video = document.createElement('video');
            this._video.srcObject = this._stream;
            this._video.autoplay = true;
            await this._video.play();
            console.log('[HumanBody] Camera started');
        } catch (err: any) {
            console.error('[HumanBody] Camera error:', err.message);
        }
    }

    private stopCamera(): void {
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop());
            this._stream = null;
        }
        this._video = null;
        console.log('[HumanBody] Camera stopped');
    }

    async analyse(action: string): Promise<void> {
        if (action === 'analyze') {
            await this.detectPose();
        }
    }

    private async detectPose(): Promise<void> {
        if (!this._video || this._analyzing) return;

        this._analyzing = true;

        try {
            // Load MoveNet model
            if (!this._detector) {
                const poseDetection = await import('@tensorflow-models/pose-detection');
                const movenet = await import('@tensorflow-models/pose-detection');
                
                this._detector = await poseDetection.createDetector(
                    movenet.SupportedModels.MoveNet,
                    {
                        modelType: movenet.movenet.modelType.SINGLEPOSE_LIGHTNING,
                    }
                );
            }

            // Detect pose
            const poses = await this._detector.estimatePoses(this._video);
            this._poses = poses;
            console.log(`[HumanBody] Detected ${poses.length} pose(s)`);
        } catch (err: any) {
            console.error('[HumanBody] Detection error:', err.message);
        }

        this._analyzing = false;
    }

    getBodyCount(): number {
        return this._poses.length;
    }

    getX(part: BodyPart, bodyIndex: number = 1): number {
        const pose = this._poses[bodyIndex - 1];
        if (!pose || !pose.keypoints) return 0;

        const keypointIdx = HumanBodyRuntime.KEYPOINT_MAP[part];
        if (keypointIdx === undefined) return 0;

        const keypoint = pose.keypoints[keypointIdx];
        if (!keypoint || keypoint.score < 0.3) return 0;

        // Convert normalized coordinates to stage coordinates
        return (keypoint.x - 0.5) * 480;
    }

    getY(part: BodyPart, bodyIndex: number = 1): number {
        const pose = this._poses[bodyIndex - 1];
        if (!pose || !pose.keypoints) return 0;

        const keypointIdx = HumanBodyRuntime.KEYPOINT_MAP[part];
        if (keypointIdx === undefined) return 0;

        const keypoint = pose.keypoints[keypointIdx];
        if (!keypoint || keypoint.score < 0.3) return 0;

        // Convert normalized coordinates to stage coordinates
        return (0.5 - keypoint.y) * 360;
    }

    isPartVisible(part: BodyPart, bodyIndex: number = 1): boolean {
        const pose = this._poses[bodyIndex - 1];
        if (!pose || !pose.keypoints) return false;

        const keypointIdx = HumanBodyRuntime.KEYPOINT_MAP[part];
        if (keypointIdx === undefined) return false;

        const keypoint = pose.keypoints[keypointIdx];
        return keypoint && keypoint.score >= 0.3;
    }

    destroy(): void {
        this.stopCamera();
        this._poses = [];
    }
}

export const humanBodyBlocks = [
    {
        type: 'bd_camera',
        message0: 'camera %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STATE',
            options: [
                ['on', 'on'],
                ['off', 'off']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Turn camera on or off for body detection',
        helpUrl: ''
    },
    {
        type: 'bd_analyze',
        message0: 'detect body pose',
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Run MoveNet pose detection on the current camera frame',
        helpUrl: ''
    },
    {
        type: 'bd_body_count',
        message0: 'body count',
        output: 'Number',
        colour: '#D43D41',
        tooltip: 'Number of people detected',
        helpUrl: ''
    },
    {
        type: 'bd_get_x',
        message0: 'x position of %1 of body %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PART',
                options: [
                    ['nose', 'nose'],
                    ['left eye', 'left_eye'],
                    ['right eye', 'right_eye'],
                    ['left ear', 'left_ear'],
                    ['right ear', 'right_ear'],
                    ['left shoulder', 'left_shoulder'],
                    ['right shoulder', 'right_shoulder'],
                    ['left elbow', 'left_elbow'],
                    ['right elbow', 'right_elbow'],
                    ['left wrist', 'left_wrist'],
                    ['right wrist', 'right_wrist'],
                    ['left hip', 'left_hip'],
                    ['right hip', 'right_hip'],
                    ['left knee', 'left_knee'],
                    ['right knee', 'right_knee'],
                    ['left ankle', 'left_ankle'],
                    ['right ankle', 'right_ankle']
                ]
            },
            {
                type: 'field_number',
                name: 'BODY',
                value: 1,
                min: 1
            }
        ],
        output: 'Number',
        colour: '#D43D41',
        tooltip: 'X position of a body part (stage coords)',
        helpUrl: ''
    },
    {
        type: 'bd_get_y',
        message0: 'y position of %1 of body %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PART',
                options: [
                    ['nose', 'nose'],
                    ['left eye', 'left_eye'],
                    ['right eye', 'right_eye'],
                    ['left ear', 'left_ear'],
                    ['right ear', 'right_ear'],
                    ['left shoulder', 'left_shoulder'],
                    ['right shoulder', 'right_shoulder'],
                    ['left elbow', 'left_elbow'],
                    ['right elbow', 'right_elbow'],
                    ['left wrist', 'left_wrist'],
                    ['right wrist', 'right_wrist'],
                    ['left hip', 'left_hip'],
                    ['right hip', 'right_hip'],
                    ['left knee', 'left_knee'],
                    ['right knee', 'right_knee'],
                    ['left ankle', 'left_ankle'],
                    ['right ankle', 'right_ankle']
                ]
            },
            {
                type: 'field_number',
                name: 'BODY',
                value: 1,
                min: 1
            }
        ],
        output: 'Number',
        colour: '#D43D41',
        tooltip: 'Y position of a body part (stage coords)',
        helpUrl: ''
    },
    {
        type: 'bd_is_part_visible',
        message0: 'is %1 of body %2 visible?',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PART',
                options: [
                    ['nose', 'nose'],
                    ['left wrist', 'left_wrist'],
                    ['right wrist', 'right_wrist'],
                    ['left knee', 'left_knee'],
                    ['right knee', 'right_knee'],
                    ['left ankle', 'left_ankle'],
                    ['right ankle', 'right_ankle']
                ]
            },
            {
                type: 'field_number',
                name: 'BODY',
                value: 1,
                min: 1
            }
        ],
        output: 'Boolean',
        colour: '#D43D41',
        tooltip: 'Check if a body part is detected with high confidence',
        helpUrl: ''
    },
];

export function registerHumanBodyBlocks() {
    const newBlocks = humanBodyBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const humanBodyExtension = {
    id: 'human_body',
    name: 'Human Body Detection',
    colour: '#D43D41',
    icon: '🤸',
    blocks: humanBodyBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
