import { useEffect, useState, useRef, useMemo } from "react";
import { DashboardMetrics } from "@/components/context/resultsComponents/DashboardMetrics";
import { PlaybackControls } from "@/components/context/resultsComponents/PlaybackControls";
import { SimulationTables } from "@/components/context/resultsComponents/SimulationTables";
import { ChartPlaceholder } from "@/components/context/resultsComponents/ChartPlaceholder";
import { ConfigPanel, type CatalogoSimple } from "@/components/context/resultsComponents/ConfigPanel"; 
import { SimulationDiagramCanvas } from "@/components/context/resultsComponents/SimulationDiagramCanvas";
import { OptimizationDialog } from "@/components/context/resultsComponents/OptimizationDialog";

import { ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCatalogos } from "@/api/catalogoApi"; 
import { getDiagramasDetalle } from "@/api/diagramaApi";
import { runVisualSimulation, runOptimizationAnalysis } from "@/api/simulacionApi";
import type { VisualSimulationResponse, AnimationFrame } from "@/types/visual-types";


function processHistory(rawList: any[], namesMap: Record<string, string>): { frames: AnimationFrame[], details: any } {
  if (!rawList || rawList.length === 0) return { frames: [], details: {} };

  const isFlat = rawList[0].ID_PROCESO !== undefined || rawList[0].id_proceso !== undefined || rawList[0].T_HIST !== undefined;
  if (!isFlat) return { frames: rawList, details: {} };
  
  const groupedFrames = new Map<number, Record<string, any>>();
  const discoveredDetails: Record<string, any> = {}; 
  
  rawList.forEach((row) => {
    const t = row.T_HIST ?? row.t_hist ?? row.time ?? 0;
    const pid = String(row.ID_PROCESO ?? row.id_proceso);
    const estado = row.ESTADO ?? row.estado ?? "Inactivo";
    const cantidad = typeof row.CANTIDAD === 'string' ? parseFloat(row.CANTIDAD) : (row.CANTIDAD || 0);
    const meta = row.META ?? row.meta ?? "0/0";
    
    const nombreMaquina = row.ID_MAQUINA ?? row.maquina ?? "-";
    const nombreProcesoReal = namesMap[pid] || `Proceso ${pid}`;

    if (!groupedFrames.has(t)) groupedFrames.set(t, {});
    const frame = groupedFrames.get(t)!;
    
    frame[pid] = {
      estado: estado,
      buffer_actual: cantidad, 
      producido: meta,
      nombre_maquina: nombreMaquina,
      nombre_proceso: nombreProcesoReal
    };

    if (!discoveredDetails[pid]) {
        discoveredDetails[pid] = {
            nombre_proceso: nombreProcesoReal,
            nombre_maquina: nombreMaquina,
            estado_final: "..."
        };
    }
    discoveredDetails[pid].estado_final = estado;
  });

  const sortedTimestamps = Array.from(groupedFrames.keys()).sort((a, b) => a - b);
  const filledFrames: AnimationFrame[] = [];
  let previousState: Record<string, any> = {};

  sortedTimestamps.forEach((t) => {
    const updates = groupedFrames.get(t)!;
    const currentState = { ...previousState, ...updates };
    filledFrames.push({ timestamp: t, procesos: currentState });
    previousState = currentState;
  });

  return { frames: filledFrames, details: discoveredDetails };
}

export default function Results() {
  const [configMode, setConfigMode] = useState(true);
  const [catalogos, setCatalogos] = useState<CatalogoSimple[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(100);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VisualSimulationResponse | null>(null);
  
  const [frames, setFrames] = useState<AnimationFrame[]>([]);
  const [generatedDetails, setGeneratedDetails] = useState<any>({});
  
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); 
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [optOpen, setOptOpen] = useState(false);
  const [optLoading, setOptLoading] = useState(false);
  const [optData, setOptData] = useState<any>(null);

  useEffect(() => {
    getCatalogos().then(setCatalogos).catch(() => toast.error("Error cargando productos"));
  }, []);

  const handleStartSimulation = async () => {
    if (!selectedProduct) return toast.warning("Selecciona un modelo");
    setLoading(true);
    setConfigMode(false); 

    try {
      const response = await runVisualSimulation({
        productos: [{ id_catalogo: Number(selectedProduct), cantidad: quantity }]
      });
      
      setData(response);

      let namesMap: Record<string, string> = {};
      try {
        const diagramData = await getDiagramasDetalle(Number(selectedProduct));
        if (diagramData.diagrama_principal?.procesos) {
            diagramData.diagrama_principal.procesos.forEach((p: any) => {
                namesMap[String(p.id_proceso)] = p.nombre_proceso;
            });
        }
        if (diagramData.subdiagramas) {
            diagramData.subdiagramas.forEach((sub: any) => {
                if (sub.procesos) {
                    sub.procesos.forEach((p: any) => {
                        namesMap[String(p.id_proceso)] = p.nombre_proceso;
                    });
                }
            });
        }
      } catch (err) {
        console.warn("No se pudieron cargar nombres.", err);
      }
      
      const rawList = response.results?.history_main || response.results?.historial_animacion || [];
      const { frames: processedFrames, details } = processHistory(rawList, namesMap);
      
      setFrames(processedFrames);
      setGeneratedDetails(details);
      
      if (processedFrames.length === 0) toast.warning("La simulación no generó pasos visibles.");
      else toast.success("Simulación lista");

      setCurrentFrameIndex(0);
      setIsPlaying(true);

    } catch (error) {
      console.error(error);
      toast.error("Error al generar simulación");
      setConfigMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOptimization = async () => {
    setOptOpen(true);
    if (optData) return;

    setOptLoading(true);
    try {
        const res = await runOptimizationAnalysis({
            productos: [{ id_catalogo: Number(selectedProduct), cantidad: quantity }]
        });
        setOptData(res);
    } catch (error) {
        toast.error("Error al calcular optimizaciones");
        setOptOpen(false);
    } finally {
        setOptLoading(false);
    }
  };

  const handleStopAndBack = () => {
    stopAnimation();
    setIsPlaying(false);
    setFrames([]);
    setData(null);
    setConfigMode(true);
  };

  const stopAnimation = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      stopAnimation(); 
      const intervalTime = 100 / speed; 
      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, intervalTime);
    } else { stopAnimation(); }
    return () => stopAnimation();
  }, [isPlaying, speed, frames.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const handleReset = () => { setIsPlaying(false); setCurrentFrameIndex(0); };
  const handleSeek = (percentage: number) => {
    if (frames.length === 0) return;
    setCurrentFrameIndex(Math.floor((percentage / 100) * (frames.length - 1)));
  };
  const cycleSpeed = () => setSpeed(s => (s >= 20 ? 1 : s * 2));

  // --- DATOS UI ---
  const currentFrame = frames[currentFrameIndex] || null;
  const progressPercent = frames.length > 0 ? (currentFrameIndex / (frames.length - 1)) * 100 : 0;
  
  const modelId = data?.simulation_metadata?.shoe_id;
  const foundModel = catalogos.find(c => c.id_catalogo === modelId);
  const modelName = foundModel ? foundModel.nombre : (data?.modelo || `Modelo ${modelId || "..."}`);
  

  const bottleneckId = data?.simulation_metadata?.bottleneck_process_id;
 
  const bottleneckBuffer = data?.simulation_metadata?.bottleneck_buffer;
  
  const chartImage = data?.results?.chart_base64;
  
  const finalDetails = Object.keys(data?.results?.detalles_procesos || {}).length > 0 
      ? data?.results?.detalles_procesos 
      : generatedDetails;

  const nodeStates = useMemo(() => {
    if (!currentFrame?.procesos) return {};
    
    return Object.entries(currentFrame.procesos).reduce((acc, [id, state]: [string, any]) => {
      const estadoStr = (state.estado || "").toUpperCase();
      let color = 'idle'; 

      if (estadoStr.includes("TRABAJANDO") || estadoStr.includes("ACTIVO")) color = 'working'; 
      else if (estadoStr.includes("PAUSADO") || estadoStr.includes("BLOQUEADO") || estadoStr.includes("LLENO") || estadoStr.includes("INACTIVO")) color = 'paused'; 
      else if (estadoStr.includes("FINALIZADO") || estadoStr.includes("COMPLETADO")) color = 'finished'; 

      acc[id] = {
        statusColor: color, 
        cola: state.buffer_actual || 0,
        nombre: state.estado || ""
      };
      return acc;
    }, {} as Record<string, any>);
  }, [currentFrame]);

  if (configMode) {
    return (
      <ConfigPanel 
        catalogos={catalogos}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        quantity={quantity}
        setQuantity={setQuantity}
        onStart={handleStartSimulation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleStopAndBack} className="text-slate-500 hover:text-slate-800 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Resultados de Optimización
              <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-100">
                {loading ? "Calculando..." : "Optimizado"}
              </Badge>
            </h1>
            <p className="text-xs text-slate-500 font-medium">{modelName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
             {!configMode && (
                <Button 
                   size="sm" 
                   onClick={handleOpenOptimization}
                   className=" from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md border-0 h-8 mr-4"
                >
                   
                   Ver combinaciones
                </Button>
             )}

             <div className="flex flex-col items-end">
                <span className="uppercase text-[10px] text-slate-400 font-bold">Meta</span>
                <span className="font-bold text-slate-700">{quantity} u.</span>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             <div className="flex flex-col items-end">
                <span className="uppercase text-[10px] text-slate-400 font-bold">Estado</span>
                <span className={`font-bold ${isPlaying ? "text-green-600" : "text-amber-600"}`}>
                  {loading ? "..." : isPlaying ? "REPRODUCIENDO" : "PAUSADO"}
                </span>
             </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1800px] mx-auto w-full relative z-10 pb-32">

        <DashboardMetrics 
          modelName={modelName}
          time={currentFrame?.timestamp || 0}
          bottleneckId={bottleneckId} 
          buffer={bottleneckBuffer} 
        />

        {data && (
            <SimulationTables 
                processDetails={finalDetails}
                currentFrameProcesses={currentFrame?.procesos || {}}
            />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6 flex-1 min-h-[500px]">
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative group">
            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm" onClick={handleReset}>
                  <RefreshCcw className="w-3 h-3 text-slate-600" />
               </Button>
            </div>
            <div className="flex-1 w-full h-full bg-slate-50/50 relative">
               <SimulationDiagramCanvas 
                  key={selectedProduct} 
                  productId={Number(selectedProduct)} 
                  simulationState={nodeStates} 
               />
               {loading && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-20">
                   <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                     <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                     <p className="text-sm font-bold text-slate-700">Optimizando Buffers...</p>
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="xl:col-span-3 h-full min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Análisis de Tiempos (Activo vs Pausado)
            </h3>
            <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 overflow-hidden">
                {chartImage ? (
                   <img 
                     src={`data:image/png;base64,${chartImage}`} 
                     alt="Gráfica de Rendimiento"
                     className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-500"
                   />
                ) : (
                   <ChartPlaceholder />
                )}
            </div>
          </div>
        </div>
      </main>

      <OptimizationDialog 
         open={optOpen} 
         onOpenChange={setOptOpen}
         data={optData}
         loading={optLoading}
      />

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
        <PlaybackControls 
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onReset={handleReset}
          progress={progressPercent}
          onSeek={handleSeek}
          speed={speed}
          onSpeedChange={cycleSpeed}
        />
      </div>
    </div>
  );
}