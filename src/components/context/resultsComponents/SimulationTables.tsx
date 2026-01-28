import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProcessDetail, ProcessState } from "@/types/visual-types";

interface SimulationTablesProps {
  processDetails: Record<string, ProcessDetail>; // Datos estáticos finales
  currentFrameProcesses: Record<string, ProcessState>; // Datos dinámicos de animación
}

export function SimulationTables({ processDetails, currentFrameProcesses }: SimulationTablesProps) {
  
  // Convertimos el objeto de detalles a un array para mapear
  const rows = Object.entries(processDetails).map(([pid, detail]) => {
    // Buscamos el estado actual en el frame de animación
    const currentState = currentFrameProcesses[pid];
    
    return {
      id: pid,
      ...detail,
      estado_actual: currentState?.estado || "ESPERANDO",
      buffer_actual: currentState?.buffer_actual || detail.buffer_recomendado,
      producido: currentState?.producido || "0"
    };
  });

  return (
    <Card className="border-slate-200 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="py-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide">
             Resultados de Optimización por Proceso
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">Buffers Calculados</Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px] text-xs font-bold text-slate-500">ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Estado Actual</TableHead>
                <TableHead className="text-center text-xs font-bold text-blue-600 bg-blue-50">Buffer Óptimo</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500">Producido</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">T. Activo</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">T. Pausado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{row.id}</TableCell>
                  <TableCell>
                    <Badge 
                        variant="outline" 
                        className={`text-[10px] h-5 min-w-[80px] justify-center ${
                            row.estado_actual.includes("ACTIVO") ? "bg-green-50 text-green-700 border-green-200" :
                            row.estado_actual.includes("PAUSADO") ? "bg-amber-50 text-amber-700 border-amber-200" :
                            row.estado_actual.includes("FINALIZADO") ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                    >
                        {row.estado_actual}
                    </Badge>
                  </TableCell>
                  
                  {/* COLUMNA CLAVE: BUFFER RECOMENDADO */}
                  <TableCell className="text-center font-bold text-blue-700 bg-blue-50/30 text-xs">
                    {row.buffer_recomendado} u.
                  </TableCell>

                  <TableCell className="text-center text-xs text-slate-600 font-mono">
                    {row.producido}
                  </TableCell>
                  
                  <TableCell className="text-right font-mono text-xs text-slate-600">
                    {row.t_activo}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-400">
                    {row.t_pausado}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}