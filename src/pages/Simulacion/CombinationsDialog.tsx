import { X, Users, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Escenario } from "@/api/simulacionApi";

interface CombinationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  scenarios: Escenario[];
  processNames: Record<string, string>; 

}

export function CombinationsDialog({ isOpen, onClose, productName, scenarios, processNames }: CombinationsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">

        {}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-blue-600" />
              Tabla de Escenarios
            </h3>
            <p className="text-sm text-slate-500">
              Opciones calculadas para: <span className="font-semibold text-slate-700">{productName}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {}
        <div className="flex-1 overflow-auto p-0 bg-white custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-center w-16 border-b"># Rank</th>
                <th className="px-4 py-3 text-center border-b">Score (Tiempo)</th>
                <th className="px-4 py-3 text-center border-b">Total Personal</th>
                <th className="px-4 py-3 text-center border-b">Total Máquinas</th>
                <th className="px-4 py-3 border-b">Distribución (Personas por Proceso)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scenarios.map((esc, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-4 py-3 text-center font-bold text-slate-400 group-hover:text-blue-600">
                    {esc.ranking}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-700 font-medium bg-slate-50/50">
                    {esc.ranking_score.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-300">
                      {esc.total_personal_usado} <Users className="w-3 h-3 ml-1 inline text-slate-400" />
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {esc.total_maquinas_usadas}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(esc.detalle_asignacion).map(([pid, det]) => {

                        const nombreReal = processNames[pid] || `Proceso ${pid}`;

                        return (
                          <div key={pid} className="flex flex-col bg-slate-50 px-2 py-1 rounded border border-slate-100 min-w-[140px]">
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]" title={nombreReal}>
                              {nombreReal}
                            </span>
                            <span className="text-slate-800 font-bold">
                              {det.personal} <span className="font-normal text-[9px] text-slate-400">pers.</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Ventana
          </Button>
        </div>
      </div>
    </div>
  );
}