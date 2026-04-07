import React, { useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useForgeStore } from '../store/useForgeStore';
import { WokwiNode } from './Nodes/WokwiNode';

// Define custom node types
const nodeTypes = {
  wokwi: WokwiNode,
};

const ForgeCanvasInner: React.FC = () => {
  const { 
    nodes: storeNodes, 
    edges: storeEdges, 
    addNode, 
    addEdge: addStoreEdge,
    updateNodePosition
  } = useForgeStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync store -> local React Flow state
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Handle new connections (wiring)
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      addStoreEdge(params as Edge);
    },
    [addStoreEdge]
  );

  // Sync local position -> store
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateNodePosition(node.id, node.position);
  }, [updateNodePosition]);

  // Handle drag and drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/forge-component');
      if (!type) return;

      const reactFlowBounds = document.querySelector('.forge-canvas-container')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 50,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      addNode(type, position, { label: `${type.toUpperCase()}` });
    },
    [addNode]
  );

  const Bg = Background as any;
  const Mm = MiniMap as any;

  return (
    <div 
      className="forge-canvas-container" 
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        style={{ background: '#0f172a' }}
      >
        <Bg 
          color="#1e293b" 
          gap={20} 
        />
        <Controls />
        <Mm 
          style={{ background: '#1e293b' }} 
          nodeColor={(n: any) => n.data?.type === 'boards' ? '#BEF264' : '#64748b'}
        />
      </ReactFlow>
    </div>
  );
};

const ForgeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <ForgeCanvasInner />
  </ReactFlowProvider>
);

export default ForgeCanvas;
