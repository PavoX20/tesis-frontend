import { useState } from "react";
import { Input } from "@/components/ui/input";
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas/DiagramCanvas";
import type { SimulationResult } from "@/api/simulacionApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// CAMBIO 1: Reemplazamos HardHat por Users
import { Clock, Package, Users, Settings2, Table, Play } from "lucide-react";
import { CombinationsDialog } from "./CombinationsDialog";

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

interface SimulationProductCardProps {
  product: Catalogo;
  units: number;
  onUnitsChange: (value: number) => void;
  result?: SimulationResult;
  manualAssignments: Record<string, number>;
  onManualAssignmentChange: (processId: string, qty: number) => void;
}

export function SimulationProductCard({
  product,
  units,
  onUnitsChange,
  result,
  manualAssignments,
  onManualAssignmentChange,
}: SimulationProductCardProps) {
  
  const [showCombinations, setShowCombinations] = useState(false);

  // Extraer datos con seguridad
  const reportesArea = result?.analisis_escenarios || [];
  const primerArea = reportesArea.length > 0 ? reportesArea[0] : null;
  const escenarios = primerArea?.escenarios || [];
  const mejorEscenario = escenarios.find(e => e.ranking === 1);
  const totalEscenarios = primerArea?.total_combinaciones || 0;
  const listaPersonal = result ? Object.entries(result.detalles_procesos) : [];

  // MODO PREVIEW: Si el tiempo total es 0, es solo carga de estructura
  const isPreview = !result || result.tiempo_total === 0;

  // Mapa de nombres para el Modal (ID -> Nombre Real)
  const processNamesMap = listaPersonal.reduce((acc, [pid, info]) => {
    acc[pid] = info.nombre_proceso || `Proceso ${pid}`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <>
      <div className="w-[480px] min-w-[480px] flex-none bg-white border border-gray-200 rounded-xl shadow-md flex flex-col gap-0 overflow-hidden hover:shadow-lg transition-all">
        
        {/* HEADER */}
        <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Producto</p>
            <p className="font-bold text-slate-800 truncate text-sm" title={product.nombre}>
              {product.nombre}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Pedidos</span>
            <Input
              type="number"
              min={1}
              value={units}
              onChange={(e) => {
                const value = Number(e.target.value);
                onUnitsChange(Number.isNaN(value) ? 0 : value);
              }}
              className="w-20 h-7 text-right bg-white text-xs font-mono border-slate-200 focus:border-blue-400"
            />
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: '650px' }}>
          
          {/* 1. SECCIÓN DE RESULTADOS */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Eficiencia
              </h4>
              {!isPreview && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                  {result?.tiempo_total.toFixed(1)}h Total
                </Badge>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg bg-gray-50/30 p-3 shadow-sm min-h-[50px] flex flex-col justify-center">
              {isPreview ? (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Play className="w-3 h-3" />
                  <span>Configura y corre la simulación</span>
                </div>
              ) : escenarios.length === 0 ? (
                <span className="text-xs text-orange-500 italic text-center">
                  ⚠️ No se encontraron combinaciones viables.
                </span>
              ) : (
                <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                  <div>
                    <span className="text-[10px] font-bold text-green-800 uppercase block mb-1">Mejor Opción</span>
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <Badge variant="outline" className="bg-white text-gray-600 border-green-200 shadow-sm">
                        {mejorEscenario?.total_personal_usado} Pers.
                      </Badge>
                      <span className="text-gray-300">|</span>
                      <Badge variant="outline" className="bg-white text-gray-600 border-green-200 shadow-sm">
                        {mejorEscenario?.total_maquinas_usadas} Maq.
                      </Badge>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Score</span>
                    <span className="text-green-600 font-mono text-sm font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                      {mejorEscenario?.ranking_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. TABLA DE ASIGNACIÓN */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              {/* CAMBIO 2: Usamos el icono Users aquí */}
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Users className="w-3 h-3" /> Personal
              </h4>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">Asignación</span>
            </div>
            
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
              {!result ? (
                <p className="text-xs text-gray-400 italic text-center py-6">Cargando...</p>
              ) : (
                <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-normal w-9/12">Proceso</th>
                        <th className="px-1 py-2 text-center font-normal w-3/12 text-[10px] uppercase text-gray-400">Max</th>
                        <th className="px-3 py-2 text-right font-normal w-3/12 text-[10px] uppercase text-gray-500">Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listaPersonal.map(([pid, info]) => {
                        const manualVal = manualAssignments[pid];
                        const isManual = manualVal !== undefined && manualVal > 0;
                        
                        return (
                          <tr key={pid} className={`transition-colors ${isManual ? 'bg-orange-50/40' : 'hover:bg-slate-50'}`}>
                            <td className="px-3 py-2 text-gray-700 align-middle leading-snug">
                              {info.nombre_proceso || `Proceso ${pid}`}
                            </td>
                            
                            <td className="px-1 py-2 text-center text-gray-400 font-mono align-middle text-[10px]">
                              {info.max_pers ?? "-"}
                            </td>

                            <td className="px-3 py-2 text-right align-middle">
                              <div className="flex items-center justify-end gap-1 relative">
                                {isManual && (
                                  <Settings2 className="w-3 h-3 text-orange-400 absolute -left-4 animate-in fade-in zoom-in" />
                                )}
                                <Input
                                  type="number"
                                  min={0}
                                  max={info.max_pers}
                                  placeholder="0" 
                                  value={manualVal ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    onManualAssignmentChange(pid, val === "" ? 0 : Number(val));
                                  }}
                                  className={`w-14 h-7 text-center text-xs px-1 shadow-sm transition-all ${
                                    isManual 
                                      ? "border-orange-300 bg-white text-orange-700 font-bold ring-1 ring-orange-100" 
                                      : "border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-blue-300"
                                  }`}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* BOTÓN VER COMBINACIONES */}
            {!isPreview && escenarios.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] h-8 mt-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-all shadow-sm"
                onClick={() => setShowCombinations(true)}
              >
                <Table className="w-3 h-3 mr-2" />
                Ver Tabla de Combinaciones ({escenarios.length})
              </Button>
            )}
          </div>

          {/* 3. MATERIALES */}
          {!isPreview && (
             <div className="space-y-2 pt-2 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-bottom-2">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Insumos Requeridos
                </h4>
                <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-gray-100">
                        {result?.lista_materiales_total.map((mat) => (
                          <tr key={mat.id_materia} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 text-gray-600 truncate max-w-[200px]">{mat.nombre}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-800 font-medium">
                              {mat.cantidad_total.toLocaleString()} <span className="text-gray-400 text-[9px] font-normal">Unidades</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
          )}

          {/* 4. DIAGRAMA */}
          <div className="border border-slate-200 rounded-lg overflow-hidden h-[120px] relative group mt-1 bg-slate-50">
            <DiagramCanvas productId={product.id_catalogo} readOnly />
            <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/5 transition-colors pointer-events-none" />
          </div>

        </div>
      </div>

      {/* MODAL DE COMBINACIONES */}
      <CombinationsDialog 
        isOpen={showCombinations} 
        onClose={() => setShowCombinations(false)} 
        productName={product.nombre}
        scenarios={escenarios}
        processNames={processNamesMap} 
      />
    </>
  );
}