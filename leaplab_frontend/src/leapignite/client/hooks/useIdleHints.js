import { useEffect, useRef, useState } from "react";
import { getLessonConfig } from "../../server/engine/LessonConfig";
import { HintManager } from "../../server/engine/HintManager";

export function useIdleHints(workspaceRef) {
    const [, setHint] = useState(null);
    const lastInteraction = useRef(null);

    useEffect(() => {
        if (!lastInteraction.current) lastInteraction.current = Date.now();
        const interval = setInterval(() => {
            const idle = Date.now() - lastInteraction.current;
            const config = getLessonConfig();
            const count = workspaceRef.current?.getAllBlocks(false).length || 0;
            const msg = HintManager.getHint(idle, config.goal, count);
            setHint(msg);
        }, 1000);

        const resetIdle = () => lastInteraction.current = Date.now();
        window.addEventListener("pointerdown", resetIdle);
        window.addEventListener("keydown", resetIdle);
        return () => {
            clearInterval(interval);
            window.removeEventListener("pointerdown", resetIdle);
            window.removeEventListener("keydown", resetIdle);
        };
    }, []);
}
