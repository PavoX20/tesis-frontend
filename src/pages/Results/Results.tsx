import { useEffect, useState, useRef } from "react";
import { DashboardMetrics } from "@/components/context/resultsComponents/DashboardMetrics";
import { PlaybackControls } from "@/components/context/resultsComponents/PlaybackControls";
import { ChartPlaceholder } from "@/components/context/resultsComponents/ChartPlaceholder";
import { SimulationTables } from "@/components/context/resultsComponents/SimulationTables";
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas/DiagramCanvas"; 
import { Loader2, Play, Settings2, Box, Package, ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/api/axiosClient";
import { getCatalogos } from "@/api/catalogoApi"; 
import type { VisualSimulationResponse, SimulationFrame } from "@/types/visual-types";

interface CatalogoSimple {
  id_catalogo: number;
  nombre: string;
}

export default function Results() {
  const [configMode, setConfigMode] = useState(true);
  const [catalogos, setCatalogos] = useState<CatalogoSimple[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(100);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VisualSimulationResponse | null>(null);
  const [frames, setFrames] = useState<SimulationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); 
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getCatalogos();
        setCatalogos(data);
      } catch (error) {
        toast.error("Error cargando productos");
      }
    };
    loadProducts();
  }, []);

  const handleStartSimulation = async () => {
    if (!selectedProduct) return toast.warning("Selecciona un modelo");
    if (quantity <= 0) return toast.warning("Cantidad inválida");

    setLoading(true);
    setConfigMode(false); 

    try {
      const response = await api.post<VisualSimulationResponse>("/simulacion/visual-run", {
        id_catalogo: Number(selectedProduct),
        cantidad: quantity
      });
      setData(response.data);
      setFrames(response.data.timeline);
      setCurrentFrameIndex(0);
      setIsPlaying(true);
      toast.success("Simulación completada");

    } catch (error) {
      console.error(error);
      toast.error("Error al generar simulación");
      setConfigMode(true);
    } finally {
      setLoading(false);
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
      const intervalTime = 500 / speed; 
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
  const cycleSpeed = () => {
    const speeds = [1, 2, 5, 10, 20];
    setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]);
  };

  const currentFrame = frames[currentFrameIndex] || null;
  const progressPercent = frames.length > 0 ? (currentFrameIndex / (frames.length - 1)) * 100 : 0;
  const nodeStates = currentFrame?.nodos || {};

  if (configMode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
        <Card className="w-full max-w-lg shadow-2xl border-white/50 bg-white/90 backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-100 p-3 rounded-2xl w-fit mb-4 text-blue-600">
              <Settings2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Nueva Simulación</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Configura los parámetros para visualizar el flujo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 px-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Modelo
                </Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-12 border-slate-200 bg-slate-50/50 hover:bg-white rounded-lg">
                    <SelectValue placeholder="Seleccionar zapato..." />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogos.map((cat) => (
                      <SelectItem key={cat.id_catalogo} value={cat.id_catalogo.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Cantidad Meta
                </Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-12 font-mono text-lg border-slate-200 bg-slate-50/50 hover:bg-white rounded-lg"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pb-8 px-8">
            <Button 
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg rounded-xl"
              onClick={handleStartSimulation}
            >
              <Play className="w-5 h-5 mr-2 fill-white" />
              Iniciar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleStopAndBack} className="text-slate-500 hover:text-slate-800 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Resultados
              <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-100">
                {loading ? "Procesando..." : "Visualización"}
              </Badge>
            </h1>
            <p className="text-xs text-slate-500">{data ? data.modelo : "Cargando..."}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
             <div className="flex flex-col items-end">
                <span className="uppercase text-[10px] text-slate-400 font-bold">Meta</span>
                <span className="font-bold text-slate-700">{quantity} u.</span>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             <div className="flex flex-col items-end">
                <span className="uppercase text-[10px] text-slate-400 font-bold">Estado</span>
                <span className={`font-bold ${isPlaying ? "text-green-600" : "text-amber-600"}`}>
                  {loading ? "..." : isPlaying ? "CORRIENDO" : "PAUSADO"}
                </span>
             </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1800px] mx-auto w-full relative z-10 pb-32">

        <DashboardMetrics 
          modelName={data?.modelo || "..."}
          time={currentFrame?.tiempo || 0}
          bottleneck={currentFrame?.cuello_botella || null}
          buffer={currentFrame?.buffer_stock || 0}
        />

        {data && (
            <SimulationTables 
                processData={currentFrame?.tabla_procesos || []}
                bodegaData={currentFrame?.tabla_bodega || []}
                maquinariaData={currentFrame?.tabla_maquinaria || []}
                personalData={currentFrame?.tabla_personal || []}
            />
        )}

        {}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6 flex-1 min-h-[500px]">

          {}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative group">
            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm" onClick={handleReset}>
                  <RefreshCcw className="w-3 h-3 text-slate-600" />
               </Button>
            </div>
            <div className="flex-1 w-full h-full bg-slate-50/50 relative">
               <DiagramCanvas 
                  readOnly 
                  productId={Number(selectedProduct)} 
                  simulationState={nodeStates} 
               />
               {loading && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-20">
                   <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                     <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                     <p className="text-sm font-bold text-slate-700">Calculando flujo óptimo...</p>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {}
          <div className="xl:col-span-3 h-full min-h-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Análisis de Eficiencia (Ideal vs Real)
            </h3>
            <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 overflow-hidden">
                {data?.grafica_base64 ? (
                   <img 
                     src={`data:image/png;base64,${data.grafica_base64}`} 
                     alt="Gráfica de Rendimiento"
                     className="max-w-full max-h-full object-contain"
                   />
                ) : (
                   <ChartPlaceholder />
                )}
            </div>
          </div>
        </div>
      </main>

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