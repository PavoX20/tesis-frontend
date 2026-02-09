import { useEffect, useState, useMemo } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  Handle, 
  Position,
  type Node, 
  type Edge 
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; 
import { Loader2 } from "lucide-react";
import { getDiagramasDetalle } from "@/api/diagramaApi"; 

export type NodeStatusColor = "idle" | "working" | "paused" | "finished";

export interface VisualNodeState {
  cola: number;
  ocupado: boolean;
  nombre: string;
  statusColor?: NodeStatusColor;
}

interface SimulationDiagramCanvasProps {
  productId: number;
  simulationState?: Record<string, VisualNodeState>;
}

const SimulationNode = ({ data }: { data: any }) => {
  const statusStyles: Record<NodeStatusColor, string> = {
    idle: "bg-white border-slate-300 text-slate-700",
    working: "bg-green-50 border-green-500 text-green-800 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-105 z-10",
    paused: "bg-orange-50 border-orange-400 text-orange-800 shadow-sm",
    finished: "bg-blue-50 border-blue-500 text-blue-800 shadow-sm",
  };

  const status = (data.status as NodeStatusColor) || "idle";
  const currentStyle = statusStyles[status];

  return (
    <div className={`relative w-[150px] px-3 py-3 rounded-lg border-2 transition-all duration-300 ${currentStyle}`}>
      <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm z-20">
        {data.id_legacy || data.orden}
      </div>
      <div className="text-center">
        <div className="text-xs font-bold leading-tight line-clamp-2">{data.label}</div>
        
      </div>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
};

export function SimulationDiagramCanvas({ productId, simulationState }: SimulationDiagramCanvasProps) {
  // Ahora TypeScript sabe que estos son nodos de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  const nodeTypes = useMemo(() => ({ custom: SimulationNode }), []);

  useEffect(() => {
    const loadDiagram = async () => {
      setLoading(true);
      try {
        const data = await getDiagramasDetalle(productId);
        const principal: any = data.diagrama_principal || {};
        const subdiagramas: any[] = data.subdiagramas || [];
        const dependencias: any[] = data.dependencias || [];

        const ROW_H = 140; const TOP_Y = 50; const CENTER_X = 400;

        const principalNodes: Node[] = (principal.procesos || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((p: any, i: number) => ({
            id: String(p.id_proceso),
            position: { x: CENTER_X, y: i * ROW_H + TOP_Y },
            type: "custom",
            data: { label: p.nombre_proceso, orden: p.orden, id_legacy: p.id_proceso, status: "idle", cola: 0 },
          }));

        const subNodes: Node[] = subdiagramas.flatMap((sub: any, i: number) => {
            const side = i % 2 === 0 ? -1 : 1;
            const layer = Math.floor(i / 2) + 1;
            const xOffset = CENTER_X + (side * 350 * layer);
            const startY = principalNodes[0]?.position.y || TOP_Y;
            return (sub.procesos || []).sort((a:any, b:any) => a.orden - b.orden).map((p: any, j: number) => ({
                id: String(p.id_proceso),
                position: { x: xOffset, y: startY + (j * ROW_H) },
                type: "custom",
                data: { label: p.nombre_proceso, orden: p.orden, id_legacy: p.id_proceso, status: "idle", cola: 0 },
            }));
        });

        const createEdges = (nodeList: any[]): Edge[] => nodeList.slice(0, -1).map((_, i) => ({
            id: `e-${nodeList[i].id}-${nodeList[i+1].id}`,
            source: nodeList[i].id, target: nodeList[i+1].id, type: 'smoothstep', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 }
        }));

        const edgesPrincipal = createEdges(principalNodes);
        const edgesSub = subdiagramas.flatMap((sub: any) => {
             const pIds = (sub.procesos || []).map((p:any) => String(p.id_proceso));
             const subGroup = subNodes.filter(n => pIds.includes(n.id));
             subGroup.sort((a,b) => a.position.y - b.position.y);
             return createEdges(subGroup);
        });

        const edgesDep: Edge[] = dependencias.map((dep: any, i: number) => ({
            id: `dep-${i}`, source: String(dep.id_origen), target: String(dep.id_destino), type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
        }));

        setNodes([...principalNodes, ...subNodes]);
        setEdges([...edgesPrincipal, ...edgesSub, ...edgesDep]);

      } catch (error) { console.error("Error cargando diagrama:", error); } finally { setLoading(false); }
    };
    if (productId) loadDiagram();
  }, [productId, setNodes, setEdges]);

  useEffect(() => {
    if (!simulationState || nodes.length === 0) return;
    setNodes((nds) => nds.map((node) => {
        const state = simulationState[node.id];
        if (!state) return node;
        const nodeData = node.data as { status?: string, cola?: number };
        
        if (nodeData.status === state.statusColor && nodeData.cola === state.cola) return node;
        
        return { 
            ...node, 
            data: { 
                ...node.data, 
                status: state.statusColor || 'idle', 
                statusTxt: state.nombre, 
                cola: state.cola 
            } 
        };
    }));
  }, [simulationState, setNodes, nodes.length]); 

  if (loading) return <div className="flex h-full items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin w-5 h-5"/> <span className="text-sm font-medium">Cargando diagrama...</span></div>;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className="bg-slate-50/50">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView minZoom={0.1} maxZoom={1.5} attributionPosition="bottom-right" nodesConnectable={false} elementsSelectable={false}>
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls showInteractive={false} className="bg-white shadow-sm border-slate-200" />
      </ReactFlow>

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur p-3 rounded-lg shadow-md border border-slate-200 z-10 text-[10px] flex flex-col gap-2">
         <span className="font-bold text-slate-500 uppercase tracking-wider mb-1">Estado de Máquina</span>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span><span className="text-slate-600">Trabajando (Activo)</span></div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span><span className="text-slate-600">Pausado</span></div>
         <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-slate-600">Finalizado</span></div>
      </div>
    </div>
  );
}