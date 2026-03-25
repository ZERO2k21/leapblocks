import React, { useEffect, useRef } from 'react';
import * as Blockly from '@blockly-runtime';
import { scratchRuntime } from '../../runtime/scratchRuntime';
import './Canvas.css';

const Canvas = ({ onWorkspaceCreated }) => {
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);

    useEffect(() => {
        if (!blocklyDiv.current) return;

        // Initialize Blockly Workspace
        const workspace = Blockly.inject(blocklyDiv.current, {
            grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
            trashcan: true,
            move: { scrollbars: true, drag: true, wheel: true },
            zoom: { controls: true, wheel: true, startScale: 0.75, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
            renderer: 'zelos', // Zelos matches the Scratch 3.0 look
            theme: Blockly.Themes.Modern
        });

        workspaceRef.current = workspace;
        if (onWorkspaceCreated) onWorkspaceCreated(workspace);

        // Handle dropping blocks from external palette
        const handleDrop = (e) => {
            e.preventDefault();
            const opcode = e.dataTransfer.getData('block-opcode');
            if (opcode && workspaceRef.current) {
                // Determine drop position in workspace coordinates
                const injectionDiv = blocklyDiv.current;
                const rect = injectionDiv.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const wsX = x / workspaceRef.current.scale;
                const wsY = y / workspaceRef.current.scale;

                // Create the block at the dropped position
                const block = workspaceRef.current.newBlock(opcode);
                block.initSvg();
                block.render();
                block.moveBy(wsX, wsY);
                block.select();
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        };

        blocklyDiv.current.addEventListener('drop', handleDrop);
        blocklyDiv.current.addEventListener('dragover', handleDragOver);

        return () => {
            workspace.dispose();
            if (blocklyDiv.current) {
                blocklyDiv.current.removeEventListener('drop', handleDrop);
                blocklyDiv.current.removeEventListener('dragover', handleDragOver);
            }
        };
    }, []);

    return (
        <div className="canvas-container">
            <div className="blockly-wrapper" ref={blocklyDiv} />
        </div>
    );
};

export default Canvas;
