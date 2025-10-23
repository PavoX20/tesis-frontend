import { useEffect, useState } from "react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import { DiagramInner, type ProcessData } from "./DiagramInner";
import { AddProcessDialog } from "./AddProcessDialog";
import { ProcessDetailPanel } from "./ProcessDetailPanel";
import { Loader2 } from "lucide-react";
import { getDiagramasDetalle } from "@/api/diagramaApi";

export default function DiagramCanvas({ productId }: { productId: number }) {
  const [nodes, setNodes] = useState<Node<ProcessData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);          // Edge[]
  const [newNodeName, setNewNodeName] = useState("");
  const [insertPos, setInsertPos] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessData | null>(null);

  const computePositions = (list: Node<ProcessData>[]) =>
    list.map((n, i) => ({
      ...n,
      position: { x: 250, y: i * 120 + 80 },
      data: { ...n.data, label: n.data.label.replace(/^\d+\.\s*/, ""), orden: i + 1 },
    }));

  const computeEdges = (list: Node<ProcessData>[]) =>
    list.slice(0, -1).map((_, i) => ({
      id: `e${i + 1}-${i + 2}`,
      source: list[i].id,
      target: list[i + 1].id,
      type: "smoothstep",
      animated: true,
    }));

  useEffect(() => {
    const fetchDiagram = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDiagramasDetalle(productId);
        const procesos = data.procesos || [];
        const sorted = [...procesos].sort((a, b) => a.orden - b.orden);

        const newNodes: Node<ProcessData>[] = sorted.map((p) => ({
          id: `p${p.id_proceso}`,
          position: { x: 0, y: 0 },
          data: {
            label: p.nombre_proceso,
            procesoId: p.id_proceso,
            orden: p.orden,
            distribucion: p.distribucion ?? "N/A",
            parametros: p.parametros ?? "N/A",
          },
          draggable: false,
          selectable: true,
        }));

        const positioned = computePositions(newNodes);
        setNodes(positioned);
        setEdges(computeEdges(positioned));
      } catch {
        setError("Error al cargar el diagrama.");
      } finally {
        setLoading(false);
      }
    };
    fetchDiagram();
  }, [productId]);

  const handleAddNode = () => {
    if (!newNodeName.trim() || !insertPos) return;
    const pos = Math.max(1, Math.min(Number(insertPos), nodes.length + 1)) - 1;
    const newNode: Node<ProcessData> = {
      id: `n${Date.now()}`,
      position: { x: 0, y: 0 },
      data: { label: newNodeName, orden: pos + 1 },
      draggable: false,
      selectable: false,
    };
    const updated = [...nodes.slice(0, pos), newNode, ...nodes.slice(pos)];
    const positioned = computePositions(updated);
    setNodes(positioned);
    setEdges(computeEdges(positioned));
    setNewNodeName("");
    setInsertPos((positioned.length + 1).toString());
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Cargando diagrama...
      </div>
    );
  }
  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="flex w-full h-[550px] bg-white border border-blue-100 rounded-xl overflow-hidden">
      <div className="w-1/2 relative border-r border-blue-100 bg-white">
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
            onNodeClick={(_, node) => setSelectedProcess(node.data)} // ya tipado
          />
        </ReactFlowProvider>
      </div>

      <div className="w-1/2 p-6 overflow-y-auto bg-blue-50">
        <ProcessDetailPanel selectedProcess={selectedProcess} />
      </div>
    </div>
  );
}