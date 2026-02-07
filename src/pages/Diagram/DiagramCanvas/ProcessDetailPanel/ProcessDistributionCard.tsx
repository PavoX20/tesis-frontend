import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AutoResponse,
  type ManualResponse,
  type RankedItem,
  getAutoDistribution,
  getDistributionParamNames,
  postManualDistribution,
} from "@/api/analysisApi";
import type { ProcessData } from "./ProcessDetailPanel";
import { Loader2, BarChart3 } from "lucide-react";
import { updateProceso } from "@/api/procesosApi";

interface Props {
  process: ProcessData | null;
  // 1. Agregamos el callback para notificar al padre
  onUpdate?: () => void;
}

const SUPPORTED_DISTRIBS = [
  { value: "norm", label: "Normal" },
  { value: "weibull_min", label: "Weibull" },
  { value: "expon", label: "Exponencial" },
  { value: "lognorm", label: "Lognormal" },
  { value: "gamma", label: "Gamma" },
];

export function ProcessDistributionCard({ process, onUpdate }: Props) {
  const [autoData, setAutoData] = useState<AutoResponse | null>(null);
  const [manualData, setManualData] = useState<ManualResponse | null>(null);

  const [selectedDistrib, setSelectedDistrib] = useState<string>("");
  const [paramNames, setParamNames] = useState<string[]>([]);
  const [paramValues, setParamValues] = useState<string[]>([]);

  const [loadingAuto, setLoadingAuto] = useState(false);
  const [loadingManual, setLoadingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const procesoId = process?.procesoId ?? null;
  const distribucionBD = process?.distribucion ?? null;
  const parametrosBD = process?.parametros ?? null;

  const currentImage = useMemo(
    () => manualData?.image_base64 ?? autoData?.image_base64 ?? null,
    [manualData, autoData]
  );

  useEffect(() => {
    if (!procesoId) {
      setAutoData(null);
      setManualData(null);
      setSelectedDistrib("");
      setParamNames([]);
      setParamValues([]);
      setError(null);
      return;
    }

    const load = async () => {
      setLoadingAuto(true);
      setError(null);
      try {
        const res = await getAutoDistribution(procesoId, 20);
        setAutoData(res);
        setManualData(null);

        if (res.modo === "auto") {
          if (res.seleccion) {
            setSelectedDistrib(res.seleccion);
            const best = res.ranking.find(
              (r) => r.distrib === res.seleccion
            ) as RankedItem | undefined;

            const baseParams = best?.parametros ?? res.parametros ?? [];
            const names = await getDistributionParamNames(res.seleccion);
            setParamNames(names);
            setParamValues(
              names.map((_, i) =>
                baseParams[i] !== undefined ? String(baseParams[i]) : ""
              )
            );
          }
        } else {
          const def = distribucionBD || "norm";
          setSelectedDistrib(def);
          const names = await getDistributionParamNames(def);
          setParamNames(names);

          const hasDbParams = Boolean(distribucionBD && parametrosBD);
          if (!hasDbParams) {
            setParamValues(names.map(() => ""));
          }
        }
      } catch (e: any) {
        console.error(e);
        if (e?.response?.status === 404) {
          setError("Este proceso no tiene mediciones registradas.");
        } else {
          setError("Error al calcular la distribución.");
        }
        setAutoData(null);
        setManualData(null);
      } finally {
        setLoadingAuto(false);
      }
    };

    load();
  }, [procesoId]);

  useEffect(() => {
    if (!procesoId) return;

    if (autoData?.modo === "auto") return;
    if (!distribucionBD) return;

    let cancelled = false;

    const initFromDB = async () => {
      try {
        const parsed: unknown =
          typeof parametrosBD === "string"
            ? JSON.parse(parametrosBD)
            : parametrosBD;
        const arr = Array.isArray(parsed) ? parsed : [];

        if (!arr.length) return;

        setSelectedDistrib(distribucionBD);

        const names = await getDistributionParamNames(distribucionBD);
        if (cancelled) return;

        setParamNames(names);
        setParamValues(
          names.map((_, i) =>
            arr[i] !== undefined && arr[i] !== null ? String(arr[i]) : ""
          )
        );

        setLoadingManual(true);
        setError(null);
        const res = await postManualDistribution(procesoId, {
          nombre: distribucionBD,
          parametros: arr,
          umbral: 20,
        });
        if (!cancelled) {
          setManualData(res);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Error inicializando distribución manual desde BD:", e);
        }
      } finally {
        if (!cancelled) {
          setLoadingManual(false);
        }
      }
    };

    initFromDB();

    return () => {
      cancelled = true;
    };
  }, [procesoId, distribucionBD, parametrosBD, autoData?.modo]);

  const handleDistribChange = async (value: string) => {
    setSelectedDistrib(value);
    setError(null);

    try {
      const names = await getDistributionParamNames(value);
      setParamNames(names);

      const isAutoMode = autoData?.modo === "auto";

      if (isAutoMode) {
        let baseParams: number[] = [];
        const fromRanking =
          autoData?.ranking.find((r) => r.distrib === value)?.parametros ?? [];
        if (Array.isArray(fromRanking)) {
          baseParams = [...fromRanking];
        }

        if (baseParams.length !== names.length) {
          setParamValues(names.map(() => ""));
          return;
        }

        setParamValues(baseParams.map((p) => String(p)));

        if (!procesoId) return;

        setLoadingManual(true);
        try {
          const res = await postManualDistribution(procesoId, {
            nombre: value,
            parametros: baseParams,
            umbral: 20,
          });
          setManualData(res);

          try {
            await updateProceso(procesoId, {
              distribucion: value,
              parametros: JSON.stringify(baseParams),
            });
            // 2. Notificar al padre tras guardar
            if (onUpdate) onUpdate();
          } catch (e) {
            console.error("Error guardando parametros en procesos:", e);
          }
        } finally {
          setLoadingManual(false);
        }
        return;
      }

      setParamValues(names.map(() => ""));
    } catch (e) {
      console.error(e);
      setParamNames([]);
      setParamValues([]);
      setError("Error al cargar parámetros de la distribución.");
    }
  };

  const handleRecalculate = async () => {
    if (!procesoId || !selectedDistrib) return;

    const nums = paramValues.map((v) => Number(v));
    if (nums.some((n) => Number.isNaN(n))) {
      setError("Todos los parámetros deben ser numéricos.");
      return;
    }

    setLoadingManual(true);
    setError(null);
    try {
      const res = await postManualDistribution(procesoId, {
        nombre: selectedDistrib,
        parametros: nums,
        umbral: 20,
      });
      setManualData(res);

      try {
        await updateProceso(procesoId, {
          distribucion: selectedDistrib,
          parametros: JSON.stringify(nums),
        });
        // 3. Notificar al padre tras guardar (para que actualice el estado global)
        if (onUpdate) onUpdate();
      } catch (e) {
        console.error("Error guardando parametros en procesos:", e);
      }
    } catch (e: any) {
      console.error(e);
      if (e?.response?.data?.detail) {
        setError(String(e.response.data.detail));
      } else {
        setError("Error al recalcular la distribución.");
      }
    } finally {
      setLoadingManual(false);
    }
  };

  if (!process || !procesoId) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        Selecciona un proceso en el diagrama para ver su distribución
        estadística.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {/* TÍTULO */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Distribución estadística
        </h2>
      </div>

      {/* LOADER */}
      {loadingAuto && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calculando distribución…
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* CARD PRINCIPAL */}
      <div className="border rounded-lg bg-white p-3 space-y-4">
        <p className="text-xs text-slate-500">
          Proceso: <span className="font-medium">{process.label}</span>
        </p>

        {autoData && (
          <div className="space-y-1 text-xs text-slate-700">
            <p className="font-medium">Mensaje:</p>
            <p className="whitespace-pre-line text-slate-600">
              {autoData.mensaje}
            </p>

            {autoData.modo === "auto" && autoData.seleccion && (
              <p className="text-xs">
                Se recomienda la distribución:{" "}
                <span className="font-semibold">
                  {autoData.seleccion === "norm"
                    ? "Normal"
                    : autoData.seleccion === "weibull_min"
                    ? "Weibull"
                    : autoData.seleccion}
                </span>
              </p>
            )}
          </div>
        )}

        {/* SELECT DISTRIBUCIÓN */}
        {autoData && (
          <div className="space-y-2">
            <Label className="text-xs">Distribución a visualizar</Label>
            {autoData.modo === "auto" && autoData.ranking.length > 0 ? (
              <Select
                value={selectedDistrib}
                onValueChange={handleDistribChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecciona distribución" />
                </SelectTrigger>
                <SelectContent>
                  {autoData.ranking.map((r) => (
                    <SelectItem key={r.distrib} value={r.distrib}>
                      {r.titulo?.split(" — ")[0] || r.distrib}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={selectedDistrib}
                onValueChange={handleDistribChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecciona distribución" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_DISTRIBS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* INPUTS DE PARÁMETROS */}
        {paramNames.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">
              Parámetros de la distribución
            </p>
            <div className="grid grid-cols-2 gap-3">
              {paramNames.map((name, idx) => (
                <div key={name} className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wide text-slate-500">
                    {name}
                  </Label>
                  <Input
                    className="h-8 text-xs"
                    value={paramValues[idx] ?? ""}
                    onChange={(e) => {
                      const copy = [...paramValues];
                      copy[idx] = e.target.value;
                      setParamValues(copy);
                    }}
                    placeholder="0.0"
                    disabled={autoData?.modo === "auto"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTÓN CALCULAR */}
        {autoData && autoData.modo !== "auto" && (
          <div>
            <Button
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleRecalculate}
              disabled={loadingManual || !selectedDistrib}
            >
              {loadingManual ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Calculando…
                </>
              ) : (
                "Calcular / Actualizar gráfica"
              )}
            </Button>
          </div>
        )}

        {/* IMAGEN DE LA GRÁFICA */}
        {currentImage && (
          <div className="rounded-md bg-slate-50 p-2">
            <img
              src={`data:image/png;base64,${currentImage}`}
              alt="Distribución del proceso"
              className="mx-auto max-h-100 rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}