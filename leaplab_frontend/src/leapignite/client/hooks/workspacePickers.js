export function handleBlockClickForPickers(block, {
    workspaceRef,
    setPickerCallback,
    setShowPicker,
    setActiveBlock,
    setShowDirPicker,
    setShowInstPicker,
    setShowPianoPicker,
    setPickerPos
}) {
    if (block.type === "go_to_location") {
        setPickerCallback(() => (x, y) => {
            if (typeof block.setGridPosition === "function") {
                block.setGridPosition(x, y);
            } else {
                block.posX = x;
                block.posY = y;
            }
            if (window.goToLocation) window.goToLocation(x, y);
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
