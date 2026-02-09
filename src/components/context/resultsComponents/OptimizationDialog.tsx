import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircuitBoard, Users, ListFilter, Database } from "lucide-react";
import type { OptimizationResponse } from "@/types/visual-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OptimizationResponse | null;
  loading: boolean;
}

export function OptimizationDialog({ open, onOpenChange, data, loading }: Props) {

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[98vw] sm:max-w-[98vw] h-[95vh] flex flex-col p-0 gap-0">

        <DialogHeader className="px-6 py-4 border-b bg-white rounded-t-lg shrink-0">
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="flex items-center gap-2 text-xl">
               <ListFilter className="w-6 h-6 text-indigo-600" />
               Tabla de Combinaciones
               {!loading && data && (
                  <Badge variant="secondary" className="ml-2 text-sm">
                      {data.total_combinaciones_generadas} escenarios
                  </Badge>
               )}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1">
             Análisis exhaustivo de todas las combinaciones posibles de máquinas y personal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-slate-50 relative flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in fade-in">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
               </div>
               <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-slate-700">Calculando escenarios...</p>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                      Esto puede tardar dependiendo del número de procesos.
                  </p>
               </div>
            </div>
          ) : (
             <ScrollArea className="flex-1 h-full w-full">
                <Table>
                   <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                      <TableRow className="hover:bg-white border-b border-slate-200">
                         <TableHead className="w-[60px] text-center font-bold text-slate-900 bg-white h-12">Rank</TableHead>
                         <TableHead className="w-[110px] text-center font-bold text-slate-900 bg-white h-12">Tiempo</TableHead>
                         <TableHead className="w-[110px] text-center font-bold text-slate-900 bg-white h-12">Buffer</TableHead>

                         {}
                         <TableHead className="w-[300px] text-center font-bold text-slate-900 bg-white h-12">Cuello de Botella</TableHead>

                         <TableHead className="w-[90px] text-center font-bold text-slate-900 bg-white h-12">Total Pers.</TableHead>
                         <TableHead className="w-[90px] text-center font-bold text-slate-900 bg-white h-12">Total Maq.</TableHead>
                         <TableHead className="font-bold text-slate-900 bg-white h-12 pl-4">Distribución (Detalle por Proceso)</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {data?.escenarios.map((esc) => (
                        <TableRow key={esc.ranking} className="odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors border-b border-slate-100">
                           {}
                           <TableCell className="text-center font-bold text-lg text-slate-500 font-mono align-middle">
                              #{esc.ranking}
                           </TableCell>

                           {}
                           <TableCell className="text-center align-middle">
                              <Badge variant="outline" className={`font-mono text-sm px-3 py-1 shadow-sm ${esc.ranking === 1 ? "bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300/50" : "bg-white text-slate-700"}`}>
                                 {formatTime(esc.tiempo_total)}
                              </Badge>
                           </TableCell>

                           {}
                           <TableCell className="text-center align-middle">
                              <div className="flex items-center justify-center">
                                <Badge variant="secondary" className="font-mono text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5">
                                   <Database className="w-3 h-3 mr-1.5 opacity-60" />
                                   {esc.buffer !== undefined 
                                      ? (Number.isInteger(esc.buffer) ? esc.buffer : esc.buffer.toFixed(1)) 
                                      : "--"} u.
                                </Badge>
                              </div>
                           </TableCell>

                           {}
                           <TableCell className="text-center align-middle">
                              <div className="flex items-center justify-center">
                                {esc.bottleneck_nombre ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 hover:bg-amber-100 max-w-[160px] truncate" title={esc.bottleneck_nombre}>

                                        <span className="truncate">{esc.bottleneck_nombre}</span>
                                    </Badge>
                                ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                )}
                              </div>
                           </TableCell>

                           {}
                           <TableCell className="text-center font-medium text-slate-600 align-middle">
                              {esc.total_personal}
                           </TableCell>

                           {}
                           <TableCell className="text-center font-medium text-slate-600 align-middle">
                              {esc.total_maquinas}
                           </TableCell>

                           {}
                           <TableCell className="py-3 px-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                                 {esc.distribucion.map((proc, idx) => (
                                    <div key={idx} className={`flex flex-col border rounded-md px-2.5 py-2 shadow-sm hover:shadow-md transition-shadow ${proc.id_proceso === esc.bottleneck_id ? 'border-amber-200 bg-amber-50/50 ring-1 ring-amber-100' : 'border-slate-200 bg-white'}`}>
                                       <span className={`text-[11px] font-bold truncate mb-1.5 border-b pb-1 ${proc.id_proceso === esc.bottleneck_id ? 'text-amber-800 border-amber-100' : 'text-slate-800 border-slate-100'}`} title={proc.nombre_proceso}>
                                          {proc.nombre_proceso}
                                       </span>
                                       <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] text-indigo-700 border border-indigo-100 flex-1 justify-center" title="Personal asignado">
                                             <Users className="w-3 h-3" />
                                             <span className="font-bold">{proc.personal_asignado}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 border border-slate-200 flex-1 justify-center" title="Máquinas asignadas">
                                             <CircuitBoard className="w-3 h-3" />
                                             <span className="font-bold">{proc.maquinas_asignadas}</span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}