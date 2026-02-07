import { useMemo } from "react";
import { 
  SimulationDiagramCanvas, 
  type NodeStatusColor, 
  type VisualNodeState 
} from "./SimulationDiagramCanvas";
import type { SimulationHistoryRow } from "@/types/visual-types";

interface SimulationDiagramProps {
  productId: number;
  currentTime: number;
  currentFrameData: Record<number, SimulationHistoryRow> | null;
}

export function SimulationDiagram({ productId, currentFrameData }: SimulationDiagramProps) {
  
  // Transformador: Backend JSON -> Visual State para el Diagrama
  const simulationState = useMemo(() => {
    if (!currentFrameData) return undefined;

    const state: Record<string, VisualNodeState> = {};

    Object.values(currentFrameData).forEach((row) => {
      const estadoStr = row.ESTADO.toUpperCase();
      let statusColor: NodeStatusColor = "idle";

      // 1. Lógica de Semáforo
      if (estadoStr.includes("TRABAJANDO") || estadoStr.includes("PRODUCIENDO") || estadoStr.includes("ACTIVO")) {
        statusColor = "working";
      } else if (estadoStr.includes("BLOQUEADO") || estadoStr.includes("PAUSADO") || estadoStr.includes("LLENO")) {
        statusColor = "paused";
      }

      // 2. Lógica de Finalización (Meta cumplida)
      let cola = 0;
      // Parsear meta "10/100" o "10"
      if (row.META && typeof row.META === "string") {
        if (row.META.includes("/")) {
           const [currStr, totStr] = row.META.split("/");
           cola = Number(currStr);
           const total = Number(totStr);
           if (total > 0 && cola >= total) statusColor = "finished";
        } else {
           cola = Number(row.META);
        }
      } else if (typeof row.META === "number") {
         cola = row.META;
      }

      // 3. Asignar al ID
      state[String(row.ID_PROCESO)] = {
        cola,
        ocupado: statusColor === "working",
        nombre: row.ESTADO,
        statusColor
      };
    });

    return state;
  }, [currentFrameData]);

  return (
    // IMPORTANTE: Este componente devuelve directamente el Canvas envuelto
    // No incluye Cards ni Headers porque Results.tsx ya maneja su propio layout o usa este dentro de una Card.
    // Si necesitas que este componente SEA la Card completa, avísame.
    // Por ahora asumo que es solo el contenido visual.
    
    <div className="w-full h-full min-h-[500px] relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
      {productId ? (
        <SimulationDiagramCanvas
          productId={productId}
          simulationState={simulationState}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          Esperando configuración...
        </div>
      )}

      {/* Leyenda Flotante (Siempre visible pero discreta) */}
      <div className="absolute bottom-4 right-16 bg-white/95 p-2.5 rounded-lg shadow-md border border-slate-200 text-[10px] flex flex-col gap-1.5 backdrop-blur-sm z-10 pointer-events-none transition-opacity duration-300">
        <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded border border-green-500 bg-green-100 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span> 
            <span className="text-slate-600 font-medium">Trabajando</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded border border-orange-400 bg-orange-100"></span> 
            <span className="text-slate-600 font-medium">En Espera / Cola</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded border border-blue-500 bg-blue-100"></span> 
            <span className="text-slate-600 font-medium">Completado</span>
        </div>
      </div>
    </div>
  );
}