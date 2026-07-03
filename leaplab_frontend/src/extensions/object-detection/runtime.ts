import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export class ObjectDetectionRuntime {
    private objects: Array<{
        label: string;
        confidence: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }> = [];

    private model: cocoSsd.ObjectDetection | null = null;
    private isModelLoaded = false;
    private videoEl: HTMLVideoElement | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    isVideoReady(): boolean {
        return !!(this.videoEl && this.videoEl.readyState >= 2);
    }

    async loadModel() {
        if (this.isModelLoaded || this.model) return;

        try {
            await tf.ready();
            this.model = await cocoSsd.load();
            this.isModelLoaded = true;
            console.log('Object Detection model loaded');
        } catch (error) {
            console.error('Failed to load object detection model:', error);
        }
    }

    async detectObjects(videoElement?: HTMLVideoElement) {
        const video = videoElement || this.videoEl;
        if (!this.isModelLoaded) {
            await this.loadModel();
        }

        if (this.model && video && video.readyState >= 2) {
            try {
                const predictions = await this.model.detect(video);
                
                const videoW = video.videoWidth || 480;
                const videoH = video.videoHeight || 360;

                this.objects = predictions.map((pred: any) => {
                    const rawX = pred.bbox[0];
                    const rawY = pred.bbox[1];
                    const rawW = pred.bbox[2];
                    const rawH = pred.bbox[3];
                    
                    const scaledX = (rawX / videoW) * 480;
                    const scaledY = (rawY / videoH) * 360;
                    const scaledW = (rawW / videoW) * 480;
                    const scaledH = (rawH / videoH) * 360;
                    
                    const stageX = Math.round(scaledX + scaledW / 2 - 240);
                    const stageY = Math.round(180 - (scaledY + scaledH / 2));
                    
                    let label = pred.class;
                    
                    const labelMap: Record<string, string> = {
                        'cell phone': 'phone',
                        'potted plant': 'plant',
                        'backpack': 'bag',
                        'handbag': 'bag',
                        'suitcase': 'bag',
                        'bicycle': 'bike',
                        'motorcycle': 'bike',
                        'laptop': 'computer',
                        'sports ball': 'ball'
                    };
                    
                    if (labelMap[label]) {
                        label = labelMap[label];
                    }

                    return {
                        label: label,
                        confidence: Math.round(pred.score * 100),
                        x: stageX,
                        y: stageY,
                        width: scaledW,
                        height: scaledH
                    };
                });
            } catch (err) {
                console.error("Object detection error:", err);
            }
        }
    }

    getLabel(n: number): string {
        return this.objects[n - 1]?.label || '';
    }

    getConfidence(n: number): number {
        return this.objects[n - 1]?.confidence || 0;
    }

    getX(n: number): number {
        return this.objects[n - 1]?.x || 0;
    }

    getY(n: number): number {
        return this.objects[n - 1]?.y || 0;
    }

    getNumberOfObjects(): number {
        return this.objects.length;
    }

    isObjectDetected(label: string): boolean {
        return this.objects.some(obj => obj.label.toLowerCase() === label.toLowerCase());
    }
}
