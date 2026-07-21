import { showToast } from "../components/Toast";
import { setFaceVideoElement } from "../../../runtime/RuntimeBridge";

export async function toggleCamera(
    isCameraOn: boolean,
    setIsCameraOn: (on: boolean) => void,
    cameraStreamRef: React.MutableRefObject<MediaStream | null>,
    cameraVideoRef: React.RefObject<HTMLVideoElement | null>
): Promise<void> {
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
