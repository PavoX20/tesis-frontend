import { useEffect, useState } from "react";
import { type Node, type Edge } from "@xyflow/react";
import type { ProcessData } from "./DiagramInner";
import { DiagramGraph } from "./DiagramGraph";
import { ProcessDetailPanel } from "./ProcessDetailPanel/ProcessDetailPanel";
import { Loader2 } from "lucide-react";
import { getDiagramasDetalle } from "@/api/diagramaApi";
import {
  createProceso,
  getProcesosLookup,
  updateProceso,
} from "@/api/procesosApi";

interface VisualNodeState {
  cola: number;
  ocupado: boolean;
  nombre: string;
}

interface DiagramCanvasProps {
  productId: number;
  readOnly?: boolean;

  simulationState?: Record<string, VisualNodeState>;
}

export default function DiagramCanvas({
  productId,
  readOnly = false,
  simulationState, 

}: DiagramCanvasProps) {
  const [nodes, setNodes] = useState<Node<ProcessData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [insertPos, setInsertPos] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessData | null>(
    null,
  );

  const [focusDiagramId, setFocusDiagramId] = useState<number | null>(null);

  useEffect(() => {
    if (!simulationState || nodes.length === 0) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {

        const processId = node.data.procesoId;

        const state = simulationState[String(processId)];

        if (state) {

          const isBusy = state.ocupado;

          return {
            ...node,
            style: {
              ...node.style,

              backgroundColor: isBusy ? "#ffedd5" : "#ffffff", 

              borderColor: isBusy ? "#f97316" : "transparent", 

              borderWidth: isBusy ? "2px" : "0px",
              transition: "background-color 0.2s, border-color 0.2s", 

            },
            data: {
              ...node.data,

              label: node.data.label,
            },
          };
        }

        return {
          ...node,
          style: {
            ...node.style,
            backgroundColor: "#ffffff",
            borderColor: "transparent",
            borderWidth: "0px",
          },
        };
      }),
    );
  }, [simulationState]); 

  const fetchDiagram = async (): Promise<Node<ProcessData>[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiagramasDetalle(productId);
      const principal: any = data.diagrama_principal || {};
      const subdiagramas: any[] = data.subdiagramas || [];
      const dependencias: any[] = data.dependencias || [];

      const principalId: number | null =
        typeof principal.id_diagrama === "number"
          ? principal.id_diagrama
          : null;

      const NODE_W = 140;
      const LEFT_GUTTER = 130;
      const ROW_H = 120;
      const TOP_Y = 140;

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
        return (minLeft + maxRight) / 2 - 20;
      };

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
            distribucion: p.distribucion ?? "",
            parametros:
              typeof p.parametros === "string"
                ? p.parametros
                : JSON.stringify(p.parametros ?? []),
            diagramaId: principal.id_diagrama,
          },
          draggable: false,
          selectable: true,
        }));

      const avgXPrincipal = principalNodes.length
        ? centerXByBounds(principalNodes)
        : 300;

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
          style: { cursor: "pointer" },
          position: { x: xAligned, y: topY },
          type: "title",
          data: {
            label: principal.nombre || "Diagrama Principal",
          },
          connectable: false,
          draggable: false,
          selectable: false,
        };
      }

      const subdiagramasNodes: Node<ProcessData>[] = subdiagramas.flatMap(
        (sub: any, i: number) => {
          const side = i % 2 === 0 ? -1 : 1;
          const xOffset = 400 + side * 400 * (Math.floor(i / 2) + 1);
          const procesosSub = (sub.procesos || []).sort(
            (a: any, b: any) => a.orden - b.orden,
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
              distribucion: p.distribucion ?? "",
              parametros:
                typeof p.parametros === "string"
                  ? p.parametros
                  : JSON.stringify(p.parametros ?? []),
              diagramaId: sub.id_diagrama,
            },
            draggable: false,
            selectable: true,
          }));

          const avgXSub =
            processNodes.length > 0 ? processNodes[0].position.x : xOffset;
          const titleNode: Node<ProcessData> = {
            id: `title-sub-${sub.id_diagrama}`,
            position: { x: avgXSub, y: ajusteY - 100 },
            type: "title",
            style: { cursor: "pointer" },
            data: { label: sub.nombre || "Subdiagrama" },
            draggable: false,
            selectable: false,
          };

          return [titleNode, ...processNodes];
        },
      );

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
          })) as any,
        ),
      );

      const edgesEntreDiagramas: Edge[] = dependencias.map(
        (dep: any, idx: number) => ({
          id: `dep-${idx}`,
          source: `p${dep.id_origen}`,
          target: `p${dep.id_destino}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#2563eb", strokeWidth: 2 },
        }),
      );

      const allNodes = [
        ...(titleNodePrincipal ? [titleNodePrincipal] : []),
        ...principalNodes,
        ...subdiagramasNodes,
      ];
      const allEdges = [
        ...edgesPrincipal,
        ...edgesSubdiagramas,
        ...edgesEntreDiagramas,
      ];

      setNodes(allNodes);
      setEdges(allEdges);

      setFocusDiagramId(principalId);

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

    const nombre = newNodeName.trim();
    const orden = Number(insertPos) || 1;

    try {
      const lookup = await getProcesosLookup({
        catalogo_id: productId,
        limit: 100,
      });

      const lowerNombre = nombre.toLocaleLowerCase("es");

      const candidatos = lookup.filter(
        (p) => (p.nombre_proceso ?? "").toLocaleLowerCase("es") === lowerNombre,
      );

      const existing =
        candidatos.find((p) => p.id_diagrama == null) ?? candidatos[0];

      if (existing) {
        await updateProceso(existing.id_proceso, {
          id_diagrama: idDiagrama,
          orden,
        });
      } else {
        await createProceso({
          nombre_proceso: nombre,
          id_diagrama: idDiagrama,
          orden,
          parametros: "[]",
          distribucion: "norm",
        });
      }

      await fetchDiagram();
      setNewNodeName("");
      setInsertPos("1");
      setDialogOpen(false);
    } catch (err: any) {
      console.error(
        "Error al agregar proceso al diagrama:",
        err?.response?.data || err,
      );
    }
  };

  const containerClassName = readOnly
    ? "flex w-full h-full bg-white"
    : "flex w-full h-[550px] bg-white border border-blue-100 rounded-xl overflow-hidden";

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
    <div className={containerClassName}>
      <div className={readOnly ? "w-full" : "w-1/2"}>
        <DiagramGraph
          nodes={nodes}
          edges={edges}
          productId={productId}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          newNodeName={newNodeName}
          setNewNodeName={setNewNodeName}
          insertPos={insertPos}
          setInsertPos={setInsertPos}
          handleAddNode={handleAddNode}
          onNodeClick={(data) => {
            if (!readOnly) setSelectedProcess(data);
          }}
          focusDiagramId={focusDiagramId}
          readOnly={readOnly}
        />
      </div>

      {!readOnly && (
        <div className="w-1/2 p-6 overflow-y-auto bg-blue-50">
          <ProcessDetailPanel
            selectedProcess={selectedProcess}
            catalogId={productId}
            onSaved={async () => {
              const updatedNodes = await fetchDiagram();
              if (selectedProcess?.procesoId && updatedNodes) {
                const updated = (updatedNodes as Node<ProcessData>[]).find(
                  (n) => n.data.procesoId === selectedProcess.procesoId,
                );
                if (updated) setSelectedProcess(updated.data);
              }
            }}
            onUnlink={async () => {
              await fetchDiagram();
              setSelectedProcess(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

