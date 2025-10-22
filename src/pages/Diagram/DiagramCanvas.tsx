import { useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiagramCanvasProps {
  productId: number;
}

interface ProcessData extends Record<string, unknown> {
  label: string;
}

export default function DiagramCanvas({ productId }: DiagramCanvasProps) {
  const [nodes, setNodes] = useState<Node<ProcessData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [insertPos, setInsertPos] = useState<string>("1");
  const [dialogOpen, setDialogOpen] = useState(false);

  const computePositions = (list: Node<ProcessData>[]) =>
    list.map((n, i) => ({
      ...n,
      position: { x: 250, y: i * 120 },
      data: {
        label: `${i + 1}. ${n.data.label.replace(/^\d+\.\s*/, "")}`,
      },
    }));

  const computeEdges = (list: Node<ProcessData>[]): Edge[] =>
    list.slice(0, -1).map((_, i) => ({
      id: `e${i + 1}-${i + 2}`,
      source: list[i].id,
      target: list[i + 1].id,
      type: "smoothstep",
      animated: true,
    }));

  const handleAddNode = () => {
    if (!newNodeName.trim() || !insertPos) return;

    const pos = Math.max(1, Math.min(Number(insertPos), nodes.length + 1)) - 1;
    const newNode: Node<ProcessData> = {
      id: `n${Date.now()}`,
      position: { x: 0, y: 0 },
      data: { label: newNodeName },
      draggable: false,
      selectable: false,
    };

    const updatedNodes = [...nodes.slice(0, pos), newNode, ...nodes.slice(pos)];
    const positioned = computePositions(updatedNodes);
    const connected = computeEdges(positioned);

    setNodes(positioned);
    setEdges(connected);
    setNewNodeName("");
    setInsertPos((positioned.length + 1).toString());
    setDialogOpen(false);
  };

  const positionPlaceholder =
    nodes.length === 0 ? "1" : `1 - ${nodes.length + 1}`;

  const isCreateDisabled =
    !newNodeName.trim() || !insertPos.trim() || Number(insertPos) < 1;

  return (
    <div className="relative w-full h-[550px] bg-white border border-blue-100 rounded-xl overflow-hidden">
      {/* Botón + */}
      <div className="absolute top-3 right-3 z-10">
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                // autocompleta con la siguiente posición libre
                setInsertPos((nodes.length + 1).toString());
              }}
            >
              +
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Agregar nuevo proceso</AlertDialogTitle>
              <AlertDialogDescription>
                Inserta un nuevo proceso dentro del flujo de{" "}
                <span className="font-semibold text-blue-600">
                  Producto #{productId}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid gap-4 py-2">
              {/* Nombre */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nodeName" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nodeName"
                  className="col-span-3"
                  placeholder={`Proceso ${nodes.length + 1}`}
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                />
              </div>

              {/* Posición */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nodePosition" className="text-right">
                  Posición
                </Label>
                <Input
                  id="nodePosition"
                  className="col-span-3"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={positionPlaceholder}
                  value={insertPos}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val)) {
                      setInsertPos(val);
                    }
                  }}
                  disabled={nodes.length === 0}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isCreateDisabled}
                onClick={handleAddNode}
              >
                Crear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Canvas */}
      <ReactFlowProvider>
        <ReactFlow
          key={nodes.length + edges.length}
          nodes={nodes}
          edges={edges}
          fitView
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        />
      </ReactFlowProvider>
    </div>
  );
}
