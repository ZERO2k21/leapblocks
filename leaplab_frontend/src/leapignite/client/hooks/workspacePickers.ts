interface PickerHandlers {
    workspaceRef: React.RefObject<any>;
    setPickerCallback: (cb: () => (x: number, y: number) => void) => void;
    setShowPicker: (show: boolean) => void;
    setActiveBlock: (block: any) => void;
    setShowDirPicker: (show: boolean) => void;
    setShowInstPicker: (show: boolean) => void;
    setShowPianoPicker: (show: boolean) => void;
    setPickerPos: (pos: { x: number; y: number }) => void;
}

export function handleBlockClickForPickers(block: any, {
    workspaceRef,
    setPickerCallback,
    setShowPicker,
    setActiveBlock,
    setShowDirPicker,
    setShowInstPicker,
    setShowPianoPicker,
    setPickerPos
}: PickerHandlers): void {
    if (block.type === "go_to_location") {
        setPickerCallback(() => (x: number, y: number) => {
            if (typeof block.setGridPosition === "function") {
                block.setGridPosition(x, y);
            } else {
                block.posX = x;
                block.posY = y;
            }
            if ((window as any).goToLocation) (window as any).goToLocation(x, y);
        });
        setShowPicker(true);
    }

    if (block.type === "move_relative") {
        setActiveBlock(block);
        setShowDirPicker(true);
    }

    if (block.type === "sound_instrument") {
        setActiveBlock(block);
        const xy = block.getRelativeToSurfaceXY();
        const scale = workspaceRef.current.getScale();
        const injectionDiv = workspaceRef.current.getInjectionDiv();
        const bBox = injectionDiv.getBoundingClientRect();
        setPickerPos({
            x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 90,
            y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
        });
        setShowInstPicker(true);
    }

    if (block.type === "sound_note") {
        setActiveBlock(block);
        const xy = block.getRelativeToSurfaceXY();
        const scale = workspaceRef.current.getScale();
        const injectionDiv = workspaceRef.current.getInjectionDiv();
        const bBox = injectionDiv.getBoundingClientRect();
        setPickerPos({
            x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 160,
            y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
        });
        setShowPianoPicker(true);
    }
}
