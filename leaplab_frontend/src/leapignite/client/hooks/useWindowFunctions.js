import { useEffect } from "react";

export function useWindowFunctions(canvasRef) {
    useEffect(() => {
        window.drawSegment = (x1, y1, x2, y2, color, width) => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        };

        window.clearPen = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        window.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms * 1000));

        return () => {
            delete window.drawSegment;
            delete window.clearPen;
            delete window.wait;
        };
    }, []);
}
