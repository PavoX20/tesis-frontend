import { Clock, AlertTriangle, Box, Layers, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardMetricsProps {
  modelName: string;
  time: number;
  bottleneckId?: number;
  buffer?: number;
}

export function DashboardMetrics({ modelName, time, bottleneckId, buffer }: DashboardMetricsProps) {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. MODELO */}
      <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Box className="w-16 h-16 text-slate-900" />
        </div>
        <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modelo Actual</p>
          <div className="mt-1">
             <h3 className="text-xl font-bold text-slate-800 truncate" title={modelName}>
               {modelName}
             </h3>
          </div>
        </CardContent>
      </Card>

      {/* 2. TIEMPO */}
      <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
           <Clock className="w-16 h-16 text-blue-600" />
        </div>
        <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiempo Transcurrido</p>
          <div className="mt-1 flex items-baseline gap-1">
             <h3 className="text-2xl font-mono font-bold text-blue-600">
               {formatTime(time)}
             </h3>
             <span className="text-xs text-slate-400 font-medium">minutos</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. CUELLO DE BOTELLA */}
      <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden group">
         <div className="absolute right-0 top-0 h-full w-1 bg-amber-500" />
         <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
         </div>
         <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
           <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Cuello de Botella
           </p>
           <div className="mt-1">
              {bottleneckId ? (
                <>
                  <h3 className="text-lg font-bold text-slate-800">Proceso {bottleneckId}</h3>
                  <p className="text-[10px] text-slate-400">Limita la velocidad total</p>
                </>
              ) : (
                <span className="text-sm text-slate-400 italic">Calculando...</span>
              )}
           </div>
         </CardContent>
      </Card>

      {/* 4. BUFFER (MODIFICADO A UNIDADES) */}
      <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden group">
         <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500" />
         <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-16 h-16 text-indigo-500" />
         </div>
         <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
           {/* CAMBIÉ EL TÍTULO */}
           <p className="text-xs font-bold text-indigo-600/80 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3" />
              Buffer Cuello de Botella
           </p>
           <div className="mt-1">
              {buffer !== undefined ? (
                <>
                  <div className="flex items-baseline gap-1">
                    {/* CAMBIÉ EL FORMATO: Sin decimales si es entero y 'u.' en vez de '%' */}
                    <h3 className="text-2xl font-mono font-bold text-slate-800">
                        {Number.isInteger(buffer) ? buffer : buffer.toFixed(1)}
                    </h3>
                    <span className="text-sm text-slate-500 font-bold">u.</span>
                  </div>
                  
                </>
              ) : (
                <span className="text-sm text-slate-400 italic">--</span>
              )}
           </div>
         </CardContent>
      </Card>

    </div>
  );
}