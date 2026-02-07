import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProcessState } from "@/types/visual-types";

interface SimulationTablesProps {
  processDetails: Record<string, any>;
  currentFrameProcesses: Record<string, ProcessState>;
}

export function SimulationTables({ processDetails, currentFrameProcesses }: SimulationTablesProps) {
  const safeDetails = processDetails || {};
  const safeProcesses = currentFrameProcesses || {};

  const allProcessIds = Array.from(
    new Set([...Object.keys(safeDetails), ...Object.keys(safeProcesses)]),
  ).sort((a, b) => Number(a) - Number(b));

  return (
    <Card className="h-full border-slate-200 shadow-sm bg-white flex flex-col overflow-hidden">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between px-4 shrink-0">
        <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Detalle por Proceso
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-normal bg-white text-slate-500">
          {allProcessIds.length} Procesos
        </Badge>
      </CardHeader>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="w-[60px] text-center font-bold text-slate-700 text-[10px] uppercase h-9">ID</TableHead>
                
                {/* --- NUEVA COLUMNA: NOMBRE (Dato real del proceso) --- */}
                <TableHead className="text-left font-bold text-slate-700 text-[10px] uppercase h-9">Nombre</TableHead>

                {/* --- COLUMNA EXISTENTE: NOMBRE DE MÁQUINA (Dato del historial) --- */}
                <TableHead className="text-left font-bold text-slate-700 text-[10px] uppercase h-9">Nombre de la máquina</TableHead>

                <TableHead className="text-center font-bold text-slate-700 text-[10px] uppercase h-9">Estado Actual</TableHead>
                <TableHead className="text-center font-bold text-slate-700 text-[10px] uppercase h-9">Cola Actual</TableHead>
                <TableHead className="text-right font-bold text-slate-700 text-[10px] uppercase h-9 pr-4">Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProcessIds.map((pid) => {
                const currentState = safeProcesses[pid] || {};
                const detail = safeDetails[pid] || {};
                const estado = currentState.estado || detail.estado_final || "ESPERANDO";
                
                // 1. NOMBRE DE MÁQUINA (Lo que ya funcionaba)
                const nombreMaquina = detail.nombre_maquina || detail.nombre || "-";
                
                // 2. NOMBRE DEL PROCESO (El que acabamos de obtener del backend)
                const nombreProceso = detail.nombre_proceso || `Proceso ${pid}`;

                return (
                  <TableRow key={pid} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <TableCell className="text-center font-bold text-slate-600 text-xs py-2">{pid}</TableCell>

                    {/* NOMBRE DEL PROCESO */}
                    <TableCell className="text-left text-xs font-medium text-slate-700 py-2 truncate max-w-[150px]" title={nombreProceso}>
                      {nombreProceso}
                    </TableCell>

                    {/* NOMBRE DE LA MÁQUINA */}
                    <TableCell className="text-left text-xs font-medium text-slate-500 py-2 truncate max-w-[150px]" title={nombreMaquina}>
                      {nombreMaquina}
                    </TableCell>

                    <TableCell className="text-center py-2">
                      <Badge 
                        variant="outline"
                        className={`text-[9px] h-5 px-2 min-w-[80px] justify-center font-semibold border ${
                          estado.toUpperCase().includes("TRABAJANDO") || estado.toUpperCase().includes("ACTIVO")
                            ? "bg-green-50 text-green-700 border-green-200"
                            : estado.toUpperCase().includes("PAUSADO") || estado.toUpperCase().includes("BLOQUEADO")
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : estado.toUpperCase().includes("FINALIZADO") 
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600 font-mono py-2">
                      {currentState.buffer_actual || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-slate-600 pr-4 py-2">
                      {currentState.producido || detail.producido || "0/0"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
}