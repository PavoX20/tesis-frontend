import { Input } from "@/components/ui/input";
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas/DiagramCanvas";
import type { SimulationResult } from "@/api/simulacionApi";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Package, HardHat } from "lucide-react";

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

interface SimulationProductCardProps {
  product: Catalogo;
  units: number;
  onUnitsChange: (value: number) => void;
  result?: SimulationResult;
}

export function SimulationProductCard({
  product,
  units,
  onUnitsChange,
  result,
}: SimulationProductCardProps) {
  
  // Lógica para extraer datos de forma segura
  const reportesArea = result?.analisis_escenarios || [];
  const primerArea = reportesArea.length > 0 ? reportesArea[0] : null;
  const escenarios = primerArea?.escenarios || [];
  
  const mejorEscenario = escenarios.find(e => e.ranking === 1);
  const totalEscenarios = primerArea?.total_combinaciones || 0;

  // Convertimos el objeto de detalles_procesos a un array para poder mapearlo
  const listaPersonal = result ? Object.entries(result.detalles_procesos) : [];

  return (
    <div className="w-[400px] min-w-[400px] flex-none bg-white border border-gray-200 rounded-xl shadow-md flex flex-col gap-0 overflow-hidden transition-all hover:shadow-lg">
      
      {/* 1) Header: Nombre del Producto y Cantidad */}
      <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Producto</p>
          <p className="font-bold text-slate-800 truncate text-sm" title={product.nombre}>
            {product.nombre}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Cantidad</span>
          <Input
            type="number"
            min={1}
            value={units}
            onChange={(e) => {
              const value = Number(e.target.value);
              onUnitsChange(Number.isNaN(value) ? 0 : value);
            }}
            className="w-20 h-7 text-right bg-white text-xs font-mono"
          />
        </div>
      </div>

      {/* Contenedor scrolleable para todo el detalle */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: '600px' }}>
        
        {/* 2) Info de Escenarios (Ranking y Eficiencia) */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Eficiencia y Tiempos
            </h4>
            {result && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] hover:bg-blue-100">
                {result.tiempo_total.toFixed(1)}h Total
              </Badge>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg bg-gray-50/50 p-2 min-h-[60px]">
            {!result ? (
              <div className="text-xs text-gray-400 italic text-center py-2">Sin datos</div>
            ) : escenarios.length === 0 ? (
              <div className="text-xs text-orange-500 text-center py-2 flex items-center justify-center gap-1">
                ⚠️ Modo Prueba (Sin opciones)
              </div>
            ) : (
              <div className="space-y-2">
                {/* Mejor Opción Resaltada */}
                {mejorEscenario && (
                  <div className="bg-white border border-green-200 rounded p-2 shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-green-700 uppercase block">Mejor Opción</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {mejorEscenario.total_personal_usado} Pers. / {mejorEscenario.total_maquinas_usadas} Maq.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Score</span>
                      <span className="text-green-600 font-mono text-xs font-bold">
                        {mejorEscenario.ranking_score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                {/* Texto indicativo de otras opciones */}
                {totalEscenarios > 1 && (
                  <p className="text-[10px] text-gray-400 text-center cursor-pointer hover:text-blue-500 transition-colors">
                    Ver otras {totalEscenarios - 1} combinaciones...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3) Tabla de Personal Asignado (AQUÍ ESTÁ EL CAMBIO DE NOMBRE) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <HardHat className="w-3 h-3" />
            Personal Asignado
          </h4>
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            {!result ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Esperando...</p>
            ) : (
              <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-normal">Proceso</th>
                      <th className="px-3 py-1.5 text-right font-normal">Personal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listaPersonal.map(([pid, info]) => (
                      <tr key={pid} className="hover:bg-slate-50 transition-colors">
                        {/* Muestra el nombre real si existe, sino el ID */}
                        <td className="px-3 py-1.5 text-gray-700 truncate max-w-[220px]" title={info.nombre_proceso}>
                          {info.nombre_proceso || `Proceso ${pid}`}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600 font-medium">
                          {info.pers} <Users className="w-3 h-3 inline ml-1 text-slate-400"/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 4) Diagrama Miniatura (Visualización) */}
        <div className="border border-slate-200 rounded-lg overflow-hidden h-[160px] relative group">
          <DiagramCanvas productId={product.id_catalogo} readOnly />
          {/* Capa transparente para que no capture scroll del mouse accidentalmente */}
          <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/5 transition-colors pointer-events-none" />
        </div>

        {/* 5) Tabla de Materiales Requeridos */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <Package className="w-3 h-3" />
            Materiales Requeridos
          </h4>
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            {!result ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Esperando...</p>
            ) : (
              <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-normal">Insumo</th>
                      <th className="px-3 py-1.5 text-right font-normal">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.lista_materiales_total.map((mat) => (
                      <tr key={mat.id_materia} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-1.5 text-gray-700 truncate max-w-[200px]" title={mat.nombre}>
                          {mat.nombre}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-blue-600 font-medium">
                          {mat.cantidad_total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}