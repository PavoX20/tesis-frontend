import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updateProceso } from "@/api/procesosApi";

interface ProcessData {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string;
}

interface ProcessDetailPanelProps {
  selectedProcess: ProcessData | null;
  onSaved?: () => void;
}

export function ProcessDetailPanel({ selectedProcess, onSaved }: ProcessDetailPanelProps) {
  const [form, setForm] = useState({
    label: "",
    distribucion: "",
    parametros: [] as string[],
  });
  const [initialForm, setInitialForm] = useState(form);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProcess) {
      const parsedParams =
        typeof selectedProcess.parametros === "string"
          ? JSON.parse(selectedProcess.parametros || "[]")
          : Array.isArray(selectedProcess.parametros)
          ? selectedProcess.parametros
          : [];

      const initial = {
        label: selectedProcess.label || "",
        distribucion: selectedProcess.distribucion || "",
        parametros: parsedParams,
      };
      setForm(initial);
      setInitialForm(initial);
    }
  }, [selectedProcess]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleParamChange = (index: number, value: string) => {
    setForm((prev) => {
      const updated = [...prev.parametros];
      updated[index] = value;
      return { ...prev, parametros: updated };
    });
  };

  const handleSave = async () => {
    if (!selectedProcess?.procesoId) return;
    setLoading(true);
    try {
      await updateProceso(selectedProcess.procesoId, {
        nombre_proceso: form.label,
        distribucion: form.distribucion,
        parametros: JSON.stringify(form.parametros.filter((p) => p !== "")),
      });

      setInitialForm(form);
      onSaved?.();
    } catch (error) {
      console.error("Error al actualizar el proceso:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(initialForm) &&
    form.label.trim() !== "" &&
    form.distribucion.trim() !== "";

  if (!selectedProcess) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 italic">
        Selecciona un proceso para ver detalles
      </div>
    );
  }

  const paramsCount: Record<string, number> = {
    norm: 2,
    expon: 2,
    lognorm: 3,
    gamma: 3,
    weibull_min: 3,
  };

  const count = paramsCount[form.distribucion] || 0;

  return (
    <div className="flex flex-col h-full justify-start">
      {/* Bloque superior */}
      <div className="space-y-4 pb-4 border-b border-gray-200 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Detalles del Proceso</h2>
        <p className="text-sm text-gray-500">
          Edita la información del proceso seleccionado
        </p>

        {/* Orden */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Orden</label>
          <Input
            value={selectedProcess.orden ?? ""}
            disabled
            className="bg-gray-100 text-gray-700 border-gray-200"
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nombre del Proceso
          </label>
          <Input
            value={form.label}
            onChange={(e) => handleChange("label", e.target.value)}
            className="bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300"
            placeholder="Nombre del proceso"
          />
        </div>

        {/* Distribución */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Distribución
          </label>
          <Select
            value={form.distribucion}
            onValueChange={(value) => handleChange("distribucion", value)}
          >
            <SelectTrigger className="bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300">
              <SelectValue placeholder="Selecciona distribución" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="norm">Normal</SelectItem>
              <SelectItem value="expon">Exponencial</SelectItem>
              <SelectItem value="lognorm">Lognormal</SelectItem>
              <SelectItem value="gamma">Gamma</SelectItem>
              <SelectItem value="weibull_min">Weibull Min</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parámetros */}
        {count > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Parámetros ({count})
            </label>
            <div className="flex gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <Input
                  key={i}
                  value={form.parametros[i] || ""}
                  onChange={(e) => handleParamChange(i, e.target.value)}
                  placeholder={`Parámetro ${i + 1}`}
                  className="bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300 w-1/3 text-sm"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      {/* Espacio reservado para el gráfico */}
      <div className="mt-8 h-[250px] border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-sm">
        Aquí irá el gráfico del proceso
      </div>
    </div>
  );
}