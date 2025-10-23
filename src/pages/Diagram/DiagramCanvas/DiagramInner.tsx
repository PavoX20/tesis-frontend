import {
  ReactFlow,
  type Node,
  type Edge,
  Controls,
  Background,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./CustomNode";

export interface ProcessData extends Record<string, unknown> {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string;
}

type OnNodeClick = (e: React.MouseEvent, node: Node<ProcessData>) => void;

interface DiagramInnerProps {
  nodes: Node<ProcessData>[];   // OK
  edges: Edge[];                // Edge NO lleva <ProcessData>
  onNodeClick?: OnNodeClick;    // nuestro tipo propio
}

export function DiagramInner({ nodes, edges, onNodeClick }: DiagramInnerProps) {

  // Adaptador: NodeMouseHandler -> OnNodeClick
  const handleNodeClick: NodeMouseHandler = (e, node) => {
    onNodeClick?.(e, node as Node<ProcessData>);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      nodeTypes={{ custom: CustomNode }}
      minZoom={0.8}
      maxZoom={1.5}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      translateExtent={[
        [0, 0],
        [600, 1200],
      ]}
    >
      <Background color="#eaeaea" gap={20} />
      <Controls showFitView={false} showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}