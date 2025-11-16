import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import { DiagramInner, type ProcessData } from "./DiagramInner";
import { AddProcessDialog } from "./AddProcessDialog";

type DiagramGraphProps = {
  nodes: Node<ProcessData>[];
  edges: Edge[];
  productId: number;

  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;

  newNodeName: string;
  setNewNodeName: (value: string) => void;

  insertPos: string;
  setInsertPos: (value: string) => void;

  handleAddNode: (idDiagrama: number | null) => Promise<void> | void;

  onNodeClick: (data: ProcessData) => void;

  // 👇 NUEVO: id del diagrama a enfocar (normalmente el principal)
  focusDiagramId: number | null;
};

export function DiagramGraph({
  nodes,
  edges,
  productId,
  dialogOpen,
  setDialogOpen,
  newNodeName,
  setNewNodeName,
  insertPos,
  setInsertPos,
  handleAddNode,
  onNodeClick,
  focusDiagramId,
}: DiagramGraphProps) {
  return (
    <div className="relative h-full border-r border-blue-100 bg-white">
      <div className="absolute top-3 right-3 z-10">
        <AddProcessDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          newNodeName={newNodeName}
          setNewNodeName={setNewNodeName}
          insertPos={insertPos}
          setInsertPos={setInsertPos}
          handleAddNode={handleAddNode}
          productId={productId}
          nodesLength={nodes.length}
        />
      </div>

      <ReactFlowProvider>
        <DiagramInner
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => onNodeClick(node.data)}
          focusDiagramId={focusDiagramId}
        />
      </ReactFlowProvider>
    </div>
  );
}