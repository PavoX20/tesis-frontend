import { Card, CardContent } from "@/components/ui/card";
import { Clock, Box, AlertOctagon, Database, ArrowUpRight } from "lucide-react";

interface DashboardMetricsProps {
  modelName: string;
  time: number;
  bottleneck: { nombre: string; cantidad_cola: number } | null;
  buffer: number;
}

export function DashboardMetrics({ modelName, time, bottleneck, buffer }: DashboardMetricsProps) {
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MODELO */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Producción Actual</p>
            <h3 className="text-lg font-bold text-slate-800 truncate max-w-[150px]" title={modelName}>
              {modelName}
            </h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Box className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. TIEMPO */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiempo Simulado</p>
            <h3 className="text-lg font-mono font-bold text-slate-800">
              {formatTime(time)}
            </h3>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. CUELLO DE BOTELLA (Dinámico) */}
      <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cuello de Botella</p>
            {bottleneck ? (
              <div className="flex flex-col">
                <span className="font-bold text-red-700 text-sm truncate">{bottleneck.nombre}</span>
                <span className="text-xs text-red-500 font-medium flex items-center mt-1">
                   <ArrowUpRight className="w-3 h-3 mr-1" /> {bottleneck.cantidad_cola} en cola
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-green-700 flex items-center h-full mt-1">
                Flujo Estable
              </span>
            )}
          </div>
          <div className={`p-2 rounded-lg ${bottleneck ? "bg-red-100 text-red-600 animate-pulse" : "bg-green-100 text-green-600"}`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. BUFFER STOCK */}
      <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Buffer</p>
            <h3 className="text-2xl font-black text-slate-800 leading-none">
              {buffer}
            </h3>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Database className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}