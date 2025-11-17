import { Input } from "@/components/ui/input";
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas/DiagramCanvas";

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

interface SimulationProductCardProps {
  product: Catalogo;
  units: number;
  onUnitsChange: (value: number) => void;
}

export function SimulationProductCard({
  product,
  units,
  onUnitsChange,
}: SimulationProductCardProps) {
  return (
    <div className="w-[380px] min-w-[380px] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3 p-4">
      {/* 1) Header: nombre + input */}
      <div className="border border-blue-100 rounded-lg bg-blue-50 px-3 py-2 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">
            Producto
          </p>
          <p className="font-semibold text-blue-800 truncate">
            {product.nombre}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-gray-500 uppercase">
            # a simular
          </span>
          <Input
            

            value={units}
            onChange={(e) => {
              const value = Number(e.target.value);
              onUnitsChange(Number.isNaN(value) ? 0 : value);
            }}
            className="w-20 h-8 text-right bg-white"
          />
        </div>
      </div>

      {/* 2) Card info pequeña (placeholder) */}
      <div className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 text-center">
        Info de simulación pendiente...
      </div>

      {/* 3) Card grande con el diagrama */}
      <div className="flex-1 border border-blue-100 rounded-lg bg-white overflow-hidden">
        <div className="h-[320px]">
          {/* Solo diagrama, sin panel, sin botón +, sin edición */}
          <DiagramCanvas productId={product.id_catalogo} readOnly />
        </div>
      </div>

      {/* 4) Card de texto inferior (placeholder) */}
      <div className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Texto de resultados de simulación pendiente...
      </div>
    </div>
  );
}
