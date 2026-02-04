import { Card, CardContent } from "@/components/ui/card";
import { Clock, Box, AlertTriangle } from "lucide-react";

interface DashboardMetricsProps {
  modelName: string;
  time?: number; 
  bottleneckId?: number | null; // Nuevo prop para el ID del cuello de botella
  buffer: number;
}

export function DashboardMetrics({ modelName, time, bottleneckId }: DashboardMetricsProps) {
  
  const safeTime = (typeof time === 'number' && !isNaN(time)) ? time : 0;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Modelo */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Modelo
            </p>
            <h3 className="text-sm font-bold text-slate-800 truncate max-w-[150px]" title={modelName}>
              {modelName || "..."}
            </h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Box className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Tiempo */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tiempo Transcurrido
            </p>
            <h3 className="text-xl font-mono font-bold text-slate-800">
              {formatSeconds(safeTime)} <span className="text-xs font-normal text-slate-400">min</span>
            </h3>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Cuello de Botella (NUEVO) */}
      <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cuello de Botella
            </p>
            <h3 className="text-sm font-bold text-amber-700 mt-1 flex items-center gap-2">
               {bottleneckId ? (
                 <>
                   <span className="text-lg">Proceso {bottleneckId}</span>
                 </>
               ) : (
                 <span className="text-slate-400 font-normal">Detectando...</span>
               )}
            </h3>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}