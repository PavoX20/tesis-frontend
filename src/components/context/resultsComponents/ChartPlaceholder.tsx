import { BarChart3 } from "lucide-react";

export function ChartPlaceholder() {
  return (
    <div className="h-full w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 min-h-[300px]">
      <div className="p-4 bg-white rounded-full shadow-sm mb-3">
        <BarChart3 className="w-8 h-8 text-slate-300" />
      </div>
      <h4 className="font-semibold text-sm text-slate-500">Espacio para Gráfica de Rendimiento</h4>
      <p className="text-xs text-center mt-1 max-w-[200px]">
        Aquí se mostrarán las estadísticas detalladas de producción y eficiencia próximamente.
      </p>
    </div>
  );
}