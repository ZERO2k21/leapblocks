/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { showToast } from "../components/Toast";
import { setFaceVideoElement } from "../../../runtime/RuntimeBridge";

export async function toggleCamera(isCameraOn, setIsCameraOn, cameraStreamRef, cameraVideoRef) {
    if (isCameraOn) {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = null;
        }
        setFaceVideoElement(null);
        setIsCameraOn(false);
    } else {
        try {
            setIsCameraOn(true);
            await new Promise(r => setTimeout(r, 50));
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            cameraStreamRef.current = stream;
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
                setFaceVideoElement(cameraVideoRef.current);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setIsCameraOn(false);
            showToast('Could not access camera. Please allow camera permissions.', 'error');
        }
    }
}
