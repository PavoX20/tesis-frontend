import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { X, Plus, ChevronDown, Loader2, Link as LinkIcon } from "lucide-react";
import {
  getDependenciasPorProceso,
  putPredecesores,
  lookupProcesos,
  type ProcesoLookupItem,
} from "@/api/depedenciasApi";

type Props = {
  procesoId: number;
  diagramaIdActual?: number | null;
  catalogoIdActual?: number | null;
  onSaved?: () => void;
};

export function DependenciesSection({
  procesoId,
  diagramaIdActual,
  catalogoIdActual,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [predecesores, setPredecesores] = useState<ProcesoLookupItem[]>([]);
  const [sucesores, setSucesores] = useState<number[]>([]); 

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ProcesoLookupItem[]>([]);
  const [optLoading, setOptLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dep = await getDependenciasPorProceso(procesoId);
        if (!alive) return;

        setPredecesores(
          (dep.predecesores || []).map((p) => ({
            id_proceso: p.id_proceso,
            nombre_proceso: p.nombre_proceso,
            orden: p.orden,
            id_diagrama: p.id_diagrama,
          }))
        );
        setSucesores((dep.sucesores || []).map((s) => s.id_proceso));
      } catch {
        setError("No se pudieron cargar las dependencias.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [procesoId]);

  const debRef = useRef<number | null>(null);
  const effectiveFilters = useMemo(
    () => ({
      q: query || undefined,
      catalogo_id: catalogoIdActual ?? undefined,
      exclude_id: procesoId,
      limit: 20,
    }),
    [query, catalogoIdActual, procesoId]
  );

  useEffect(() => {
    if (!open) return;
    if (debRef.current) window.clearTimeout(debRef.current);

    debRef.current = window.setTimeout(async () => {
      setOptLoading(true);
      try {
        const items = await lookupProcesos(effectiveFilters);
        const selectedIds = new Set(predecesores.map((p) => p.id_proceso));
        const successorsSet = new Set(sucesores);

        const filtered = items.filter((it) => {
          if (it.id_proceso === procesoId) return false;

          if (it.id_diagrama == null) return false;

          if (diagramaIdActual != null && it.id_diagrama === diagramaIdActual)
            return false;

          if (selectedIds.has(it.id_proceso)) return false;
          if (successorsSet.has(it.id_proceso)) return false;

          if (catalogoIdActual != null && it.catalogo_id !== catalogoIdActual)
            return false;

          return true;
        });

        setOptions(filtered);
      } catch {
        setOptions([]);
      } finally {
        setOptLoading(false);
      }
    }, 280);

    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [
    effectiveFilters,
    predecesores,
    sucesores,
    open,
    procesoId,
    diagramaIdActual,
    catalogoIdActual,
  ]);

  const addPred = (item: ProcesoLookupItem) => {
    setPredecesores((prev) => [...prev, item]);
    setOpen(false);
  };

  const removePred = (id: number) => {
    setPredecesores((prev) => prev.filter((p) => p.id_proceso !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await putPredecesores(
        procesoId,
        predecesores.map((p) => p.id_proceso),
        false 

      );
      onSaved?.();
    } catch (e: any) {
      const detail =
        e?.response?.data?.detail ??
        e?.response?.data ??
        e?.message ??
        "Error al guardar dependencias.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      console.error("PUT /dependencias/predecesores error:", e?.response ?? e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LinkIcon className="h-5 w-5" /> Dependencias
        </h2>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando dependencias…
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {predecesores.length === 0 && (
              <span className="text-sm text-gray-500 italic">
                Sin predecesores
              </span>
            )}
            {predecesores.map((p) => (
              <Badge
                key={p.id_proceso}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <span className="truncate max-w-[220px]">
                  {p.nombre_proceso}
                </span>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => removePred(p.id_proceso)}
                  aria-label="Quitar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar predecesor
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[420px]">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar proceso…"
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {optLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 p-2">
                          Sin resultados
                        </span>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((opt) => (
                        <CommandItem
                          key={opt.id_proceso}
                          onSelect={() => addPred(opt)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {opt.nombre_proceso}
                            </span>
                            <span className="text-xs text-gray-500">
                              {opt.diagrama_nombre ??
                                `Diagrama ${opt.id_diagrama}`}{" "}
                              · {opt.tipo ?? "NORMAL"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar dependencias
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}

