// src/pages/Diagram/DiagramCanvas/DiagramInner.tsx
import {
  ReactFlow,
  type Node,
  type Edge,
  Controls,
  Background,
  type NodeMouseHandler,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLayoutEffect } from "react";
import { CustomNode } from "./CustomNode";

export interface ProcessData extends Record<string, unknown> {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string;
  diagramaId?: number; // id del diagrama al que pertenece el proceso
}

type OnNodeClick = (e: React.MouseEvent, node: Node<ProcessData>) => void;

interface DiagramInnerProps {
  nodes: Node<ProcessData>[];
  edges: Edge[];
  onNodeClick?: OnNodeClick;
  focusDiagramId: number | null;
  readOnly?: boolean;
}

function TitleNode({ data }: { data: { label: string } }) {
  const isSubdiagram = data.label?.toLowerCase().includes("subdiagrama");
  return (
    <div
      className={`text-xl cursor-pointer hover:underline ${
        isSubdiagram
          ? "font-normal text-blue-600"
          : "font-semibold text-blue-700"
      }`}
      style={{ width: 130, textAlign: "center" }}
    >
      {data.label}
    </div>
  );
}

export function DiagramInner({
  nodes,
  edges,
  onNodeClick,
  focusDiagramId,
  readOnly = false,
}: DiagramInnerProps) {
  const reactFlow = useReactFlow();

  const handleNodeClick: NodeMouseHandler = (e, node) => {
    onNodeClick?.(e, node as Node<ProcessData>);
  };

  // 👉 Enfoque inicial (fitView) con padding distinto según modo
  useLayoutEffect(() => {
    if (!nodes.length) return;

    let targetNodes = nodes.filter((n) => n.type !== "title");

    if (focusDiagramId != null) {
      const diagNodes = nodes.filter(
        (n) =>
          (n.data as ProcessData | undefined)?.diagramaId === focusDiagramId
      );
      if (diagNodes.length > 0) {
        targetNodes = diagNodes;
      }
    }

    if (!targetNodes.length) return;

    reactFlow.fitView({
      nodes: targetNodes.map((n) => ({ id: n.id })),
      padding: readOnly ? 1.2 : 0.2, 
      duration: 0,
    });
  }, [nodes, focusDiagramId, reactFlow, readOnly]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={handleNodeClick}
      nodeTypes={{
        custom: CustomNode,
        title: TitleNode,
      }}
      // 👇 sin minZoom / maxZoom -> usa los valores por defecto, rango muy amplio
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
    >
      <Background color="#eaeaea" gap={20} />

      {/* Controles + / - visibles en ambos modos */}
      <Controls
        showFitView={false}
        showInteractive={false}
        position="bottom-right"
      />
    </ReactFlow>
  );
}
