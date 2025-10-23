interface ProcessData {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string;
}

interface ProcessDetailPanelProps {
  selectedProcess: ProcessData | null;
}

export function ProcessDetailPanel({ selectedProcess }: ProcessDetailPanelProps) {
  if (!selectedProcess) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 italic">
        Selecciona un proceso para ver detalles
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-blue-700">
        Detalles del Proceso
      </h2>
      <p>
        <span className="font-medium">Orden:</span> {selectedProcess.orden}
      </p>
      <p>
        <span className="font-medium">Nombre:</span> {selectedProcess.label}
      </p>
      <p>
        <span className="font-medium">Distribución:</span>{" "}
        {selectedProcess.distribucion ?? "N/A"}
      </p>
      <p>
        <span className="font-medium">Parámetros:</span>{" "}
        {selectedProcess.parametros ?? "N/A"}
      </p>
    </div>
  );
}