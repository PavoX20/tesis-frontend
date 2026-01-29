import { Card, CardContent } from "@/components/ui/card";
import { Clock, Box, AlertOctagon, Zap } from "lucide-react";

interface DashboardMetricsProps {
  modelName: string;
  time: number; // Viene en segundos
  bottleneck: any; 
  buffer: number;
}

export function DashboardMetrics({ modelName, time }: DashboardMetricsProps) {
  
  // Función auxiliar para formatear segundos a MM:SS
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Modelo */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modelo</p>
            <h3 className="text-lg font-bold text-slate-800 truncate max-w-[150px]" title={modelName}>
              {modelName}
            </h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Box className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Tiempo */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiempo Simulado</p>
            <h3 className="text-xl font-mono font-bold text-slate-800">
              {formatSeconds(time)}
            </h3>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Status General (Reemplazando Cuello de Botella específico) */}
      <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado del Sistema</p>
            <h3 className="text-sm font-bold text-green-700 mt-1">
               Optimización Activa
            </h3>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-green-600">
            <Zap className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>


    </div>
  );
}