import { useEffect, useState } from "react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import { DiagramInner, type ProcessData } from "./DiagramInner";
import { AddProcessDialog } from "./AddProcessDialog";
import { ProcessDetailPanel } from "./ProcessDetailPanel";
import { Loader2 } from "lucide-react";
import { getDiagramasDetalle } from "@/api/diagramaApi";
import { createProceso } from "@/api/procesosApi";

export default function DiagramCanvas({ productId }: { productId: number }) {
  const [nodes, setNodes] = useState<Node<ProcessData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [insertPos, setInsertPos] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessData | null>(
    null
  );

  const fetchDiagram = async (): Promise<Node<ProcessData>[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiagramasDetalle(productId);
      const principal: any = data.diagrama_principal || {};
      const subdiagramas: any[] = data.subdiagramas || [];
      const dependencias: any[] = data.dependencias || [];

      // 🔹 Constantes visuales
      const NODE_W = 140; // ancho del CustomNode
      const LEFT_GUTTER = 130; // espacio del número (-left-6 aprox)
      const ROW_H = 120;
      const TOP_Y = 140;

      // 🔹 Helper: centrado ajustado (más a la izquierda)
      const centerXByBounds = (list: Node<ProcessData>[]) => {
        if (!list.length) return 400 + NODE_W / 2;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        for (const n of list) {
          const left = n.position.x - LEFT_GUTTER;
          const right = n.position.x + NODE_W;
          if (left < minLeft) minLeft = left;
          if (right > maxRight) maxRight = right;
        }
        return (minLeft + maxRight) / 2 - 20; // desplazamiento a la izquierda
      };

      // 🔹 Crear nodos del diagrama principal
      const principalNodes: Node<ProcessData>[] = (principal.procesos || [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((p: any, i: number) => ({
          id: `p${p.id_proceso}`,
          position: { x: 400, y: i * ROW_H + TOP_Y },
          type: "custom",
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

      // 🔹 Calcular centro horizontal real del diagrama principal
      const avgXPrincipal = principalNodes.length
        ? centerXByBounds(principalNodes)
        : 300;

      // 🔹 Nodo del título del principal como nodo independiente (alineado en eje X)
      let titleNodePrincipal: Node<ProcessData> | null = null;
      if (principalNodes.length > 0 || subdiagramas.length > 0) {
        const xAligned =
          principalNodes.length > 0
            ? principalNodes[0].position.x
            : avgXPrincipal;
        const topY =
          principalNodes.length > 0 ? principalNodes[0].position.y - 100 : 60;
        titleNodePrincipal = {
          id: "title-principal",
          position: { x: xAligned, y: topY },
          // 👇 CAMBIO: Usa el tipo 'default' que sí aplica el 'style'
          type: "title",
          data: {
                  label: principal.nombre || "Diagrama Principal",
              },
              
              // 👇 AÑADIDO: Esta es la solución directa
              connectable: false,
              draggable: false,
              selectable: false,
        };
      }

      // 🔹 Subdiagramas con centrado dinámico
      const subdiagramasNodes: Node<ProcessData>[] = subdiagramas.flatMap(
        (sub: any, i: number) => {
          const side = i % 2 === 0 ? -1 : 1;
          const xOffset = 400 + side * 400 * (Math.floor(i / 2) + 1);
          const procesosSub = (sub.procesos || []).sort(
            (a: any, b: any) => a.orden - b.orden
          );
          const ajusteY = principalNodes[0]?.position.y || TOP_Y;

          const processNodes = procesosSub.map((p: any, j: number) => ({
            id: `p${p.id_proceso}`,
            position: { x: xOffset, y: ajusteY + j * ROW_H },
            type: "custom",
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

          const avgXSub =
            processNodes.length > 0 ? processNodes[0].position.x : xOffset;
          const titleNode: Node<ProcessData> = {
            id: `title-sub-${sub.id_diagrama}`,
            position: { x: avgXSub, y: ajusteY - 100 },
            // 👇 CAMBIO: Usa el tipo 'default'
            type: "title",
            data: {
              label: sub.nombre || "Subdiagrama",
              
            },

            
            
            draggable: false,
            selectable: false,
          };

          // Remove edgeTitleSub logic: do not connect title to first process
          return [titleNode, ...processNodes];
        }
      );

      // 🔹 Edges internos (verticales)
      const makeEdges = (nodes: Node<ProcessData>[]) =>
        nodes.slice(0, -1).map((_, i) => ({
          id: `e${nodes[i].id}-${nodes[i + 1].id}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: "smoothstep",
          animated: true,
        }));

      const edgesPrincipal = makeEdges(principalNodes);
      const edgesSubdiagramas = subdiagramas.flatMap((sub: any) =>
        makeEdges(
          (sub.procesos || []).map((p: any) => ({
            id: `p${p.id_proceso}`,
          })) as any
        )
      );

      // 🔹 Conectar título con el primer proceso (REMOVED)
      // const edgeTitlePrincipal = ...

      // 🔹 Edges entre diagramas (azules)
      const edgesEntreDiagramas: Edge[] = dependencias.map(
        (dep: any, idx: number) => ({
          id: `dep-${idx}`,
          source: `p${dep.id_origen}`,
          target: `p${dep.id_destino}`,
          type: "bezier",
          animated: true,
          style: { stroke: "#2563eb", strokeWidth: 2 },
        })
      );

      // 🔹 Unir todo
      const allNodes = [
        ...(titleNodePrincipal ? [titleNodePrincipal] : []),
        ...principalNodes,
        ...subdiagramasNodes,
      ];
      const allEdges = [
        // ...edgeTitlePrincipal, // REMOVED
        ...edgesPrincipal,
        ...edgesSubdiagramas,
        ...edgesEntreDiagramas,
        // ...subdiagramasNodes.filter((item): item is Edge => !('data' in item)), // REMOVED
      ];

      setNodes(allNodes);
      setEdges(allEdges);
      return allNodes;
    } catch (err) {
      console.error("Error al cargar el diagrama:", err);
      setError("Error al cargar el diagrama.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagram();
  }, [productId]);
  useEffect(() => {
    setSelectedProcess(null);
  }, [productId]);

  const handleAddNode = async (idDiagrama: number | null) => {
    if (!newNodeName.trim() || !idDiagrama) return;

    console.log("📘 Creando proceso en diagrama ID:", idDiagrama); // 👈 agrega esto

    const procesoData = {
      nombre_proceso: newNodeName.trim(),
      id_diagrama: idDiagrama,
      orden: Number(insertPos),
      parametros: "[]",
      distribucion: "norm",
    };

    await createProceso(procesoData);
    await fetchDiagram();

    setNewNodeName("");
    setInsertPos("1");
    setDialogOpen(false);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Cargando diagrama...
      </div>
    );

  if (error)
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-medium">
        {error}
      </div>
    );

  return (
    <div className="flex w-full h-[550px] bg-white border border-blue-100 rounded-xl overflow-hidden">
      {/* Zona izquierda: Canvas */}
      <div className="w-1/2 relative border-r border-blue-100 bg-white">
        <div className="absolute top-3 right-3 z-10">
          <AddProcessDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            newNodeName={newNodeName}
            setNewNodeName={setNewNodeName}
            insertPos={insertPos}
            setInsertPos={setInsertPos}
            handleAddNode={handleAddNode} // ✅ sin cambios aquí
            productId={productId}
            nodesLength={nodes.length}
          />
        </div>

        <ReactFlowProvider>
          <DiagramInner
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelectedProcess(node.data)}
          />
        </ReactFlowProvider>
      </div>

      {/* Zona derecha: Panel de detalles */}
      <div className="w-1/2 p-6 overflow-y-auto bg-blue-50">
        <ProcessDetailPanel
          selectedProcess={selectedProcess}
          onSaved={async () => {
            const updatedNodes = await fetchDiagram();
            if (selectedProcess?.procesoId && updatedNodes) {
              const updated = (updatedNodes as Node<ProcessData>[]).find(
                (n) => n.data.procesoId === selectedProcess.procesoId
              );
              if (updated) setSelectedProcess(updated.data);
            }
          }}
        />
      </div>
    </div>
  );
}
