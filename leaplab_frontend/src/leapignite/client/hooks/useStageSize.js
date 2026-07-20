import { useState, useEffect } from "react";

export function useStageSize(stageContainerRef) {
    const [stageSize, setStageSize] = useState({ width: 480, height: 360 });

    useEffect(() => {
        const updateStageSize = () => {
            const rect = stageContainerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const nextWidth = Math.max(1, Math.round(rect.width));
            const nextHeight = Math.max(1, Math.round(rect.height));

            setStageSize((prev) => (
                prev.width === nextWidth && prev.height === nextHeight
                    ? prev
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateStageSize();

        const stageNode = stageContainerRef.current;
        const resizeObserver = stageNode && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateStageSize)
            : null;

        resizeObserver?.observe(stageNode);
        window.addEventListener("resize", updateStageSize);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateStageSize);
        };
    }, []);

    return stageSize;
}
