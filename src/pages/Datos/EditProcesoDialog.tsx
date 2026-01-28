import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { ProcesoLookupRow as ProcesoLookup } from "@/api/procesosApi";
import { updateProceso } from "@/api/procesosApi";
import { getCatalogos, type Catalogo } from "@/api/catalogoApi";
import { getDiagramasByCatalogo, type Diagrama } from "@/api/diagramaApi";
import {
  listDatosProceso,
  type DatoProceso,
  createDatoProceso, 

} from "@/api/datosProcesoApi";

function normalizeCatalogList(cats: any): Catalogo[] {
  if (Array.isArray(cats)) return cats;
  if (cats?.data && Array.isArray(cats.data)) return cats.data;
  if (cats?.items && Array.isArray(cats.items)) return cats.items;
  return [];
}

function normalizeDatosCatalogId(ds: any[]): { id_catalogo: number | null }[] {
  return (Array.isArray(ds) ? ds : []).map((d) => ({
    id_catalogo: (d as any).id_catalogo ?? (d as any).catalogo_id ?? null,
  }));
}

function mostFrequentCatalogId(
  datos: { id_catalogo: number | null }[]
): number | null {
  const counts = new Map<number, number>();
  for (const d of datos) {
    if (typeof d.id_catalogo === "number") {
      counts.set(d.id_catalogo, (counts.get(d.id_catalogo) ?? 0) + 1);
    }
  }
  let best: number | null = null;
  let bestCount = -1;
  for (const [id, c] of counts) {
    if (c > bestCount) {
      best = id;
      bestCount = c;
    }
  }
  return best;
}

function secondsToIntervalString(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "";

  const total = Math.max(0, totalSeconds);
  const whole = Math.floor(total);
  const frac = total - whole;

  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const micros = Math.round(frac * 1_000_000);

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  const microStr = micros.toString().padStart(6, "0");

  return `${hours}:${mm}:${ss}.${microStr}`;
}

function parseMinSec(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const [mStr, sStr] = trimmed.split(":");
    const m = parseInt(mStr, 10);
    const s = parseInt(sStr, 10);
    if (Number.isNaN(m) || Number.isNaN(s) || m < 0 || s < 0) return null;
    return m * 60 + s;
  }

  const min = parseFloat(trimmed);
  if (Number.isNaN(min)) return null;
  return min * 60;
}

function formatMinSec(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "";
  const total = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const ss = seconds.toString().padStart(2, "0");
  return `${minutes}:${ss}`;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proceso: ProcesoLookup | null;
  onSaved?: () => void;
};

export default function EditProcesoDialog({
  open,
  onOpenChange,
  proceso,
  onSaved,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState<number | null>(null);

  const [diagramas, setDiagramas] = useState<Diagrama[]>([]);
  const [diagramaId, setDiagramaId] = useState<number | null>(null);

  const [datos, setDatos] = useState<DatoProceso[]>([]);

  const [creatingDato, setCreatingDato] = useState(false);
  const [newDato, setNewDato] = useState<{
    fecha: string;
    cantidad: string;
    tiempo_min: string;
    tiempo_seg: string;
    operario: string;
    notas: string;
  }>({
    fecha: "",
    cantidad: "",
    tiempo_min: "",
    tiempo_seg: "",
    operario: "",
    notas: "",
  });

  const handleMinChange = (value: string) => {
    setNewDato((prev) => {
      const totalSeconds = parseMinSec(value);
      const seg = totalSeconds != null ? totalSeconds.toString() : "";
      return { ...prev, tiempo_min: value, tiempo_seg: seg };
    });
  };

  const handleSegChange = (value: string) => {
    setNewDato((prev) => {
      const n = parseFloat(value);
      const minStr =
        !Number.isNaN(n) && value !== "" ? formatMinSec(n) : "";
      return { ...prev, tiempo_seg: value, tiempo_min: minStr };
    });
  };

  useEffect(() => {
    if (!open || !proceso) return;

    setNombre(proceso.nombre_proceso ?? "");
    setCatalogoId(proceso.catalogo_id ?? null);
    setDiagramaId(proceso.id_diagrama ?? null);

    setNewDato((prev) => ({
      ...prev,
      fecha: new Date().toISOString().slice(0, 10), 

      cantidad: "",
      tiempo_min: "",
      tiempo_seg: "",
      operario: "",
      notas: "",
    }));

    let cancel = false;

    (async () => {
      try {
        const [catsRaw, datosProc] = await Promise.all([
          getCatalogos(),
          listDatosProceso(proceso.id_proceso, 1000),
        ]);
        if (cancel) return;

        const cats = normalizeCatalogList(catsRaw);
        setCatalogos(cats);
        setDatos(datosProc);

        if (proceso.catalogo_id) {
          const dias = await getDiagramasByCatalogo(proceso.catalogo_id);
          if (cancel) return;
          setDiagramas(dias);

          const stillValid = dias.some(
            (d) => d.id_diagrama === (proceso.id_diagrama ?? -1)
          );
          if (!stillValid) setDiagramaId(null);
        } else {
          const datosNorm = normalizeDatosCatalogId(datosProc as any[]);
          const suggested = mostFrequentCatalogId(datosNorm);
          if (suggested != null) {
            setCatalogoId(suggested);
            try {
              const dias = await getDiagramasByCatalogo(suggested);
              if (cancel) return;
              setDiagramas(dias);

              const stillValid = dias.some(
                (d) => d.id_diagrama === (proceso.id_diagrama ?? -1)
              );
              if (!stillValid) setDiagramaId(null);
            } catch {
              if (!cancel) {
                setDiagramas([]);
                setDiagramaId(null);
              }
            }
          } else {
            setDiagramas([]);
            setDiagramaId(null);
          }
        }
      } catch {
        if (cancel) return;
        setCatalogos([]);
        setDiagramas([]);
        setDatos([]);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [open, proceso]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!catalogoId) {
        setDiagramas([]);
        setDiagramaId(null);
        return;
      }
      try {
        const dias = await getDiagramasByCatalogo(catalogoId);
        if (cancel) return;
        setDiagramas(dias);

        const match = dias.some((d) => d.id_diagrama === diagramaId);
        if (!match) setDiagramaId(null);
      } catch {
        if (cancel) return;
        setDiagramas([]);
        setDiagramaId(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [catalogoId, diagramaId]);

  const canSave = useMemo(() => {
    if (!proceso) return false;
    const nombreChanged =
      (nombre ?? "").trim() !== (proceso.nombre_proceso ?? "");
    const diagramaChanged =
      (diagramaId ?? null) !== (proceso.id_diagrama ?? null);
    return nombre.trim().length > 0 && (nombreChanged || diagramaChanged);
  }, [nombre, diagramaId, proceso]);

  async function handleSave() {
    if (!proceso) return;
    setLoading(true);
    try {
      await updateProceso(proceso.id_proceso, {
        nombre_proceso: nombre.trim(),
        id_diagrama: diagramaId ?? null,
      });
      onSaved?.();
      onOpenChange(false);
    } catch {
      alert("No se pudo guardar los cambios.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDato() {
    if (!proceso) return;
    if (!catalogoId) {
      alert("Selecciona un artículo antes de agregar mediciones.");
      return;
    }
    if (!newDato.fecha) {
      alert("Indica la fecha de la medición.");
      return;
    }

    const minStr = newDato.tiempo_min.trim();
    const segStr = newDato.tiempo_seg.trim();
    const minNumSeconds = parseMinSec(minStr);
    const segNum = parseFloat(segStr);

    let totalSeconds: number | null = null;

    if (segStr !== "" && !Number.isNaN(segNum)) {
      totalSeconds = segNum;
    } else if (minStr !== "" && minNumSeconds != null) {
      totalSeconds = minNumSeconds;
    }

    if (totalSeconds === null) {
      alert("Indica el tiempo total en minutos o en segundos.");
      return;
    }

    const tiempoTotalMinText = secondsToIntervalString(totalSeconds);
    const tiempoTotalSegText = String(Math.round(totalSeconds));

    setCreatingDato(true);
    try {
      const created = await createDatoProceso({
        id_proceso: proceso.id_proceso,
        id_catalogo: catalogoId,
        cantidad:
          newDato.cantidad.trim() !== "" ? Number(newDato.cantidad) : null,
        fecha: newDato.fecha,
        tiempo_total_min: tiempoTotalMinText,
        tiempo_total_seg: tiempoTotalSegText,
        operario:
          newDato.operario.trim() !== "" ? newDato.operario.trim() : null,
        notas: newDato.notas.trim() !== "" ? newDato.notas.trim() : null,
      });

      setDatos((prev) => [created, ...prev]);

      setNewDato((prev) => ({
        ...prev,
        cantidad: "",
        tiempo_min: "",
        tiempo_seg: "",
        operario: "",
        notas: "",
      }));
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.response?.data ??
        e?.message ??
        "No se pudo crear la medición.";
      alert(String(msg));
    } finally {
      setCreatingDato(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[96vw] sm:max-w-[1200px] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Editar proceso
          </DialogTitle>
          <DialogDescription>
            Cambia el nombre, el artículo y el diagrama al que pertenece este
            proceso. Abajo verás sus mediciones.
          </DialogDescription>
        </DialogHeader>

        {}
        <div className="space-y-4">
          {}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombre del proceso
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del proceso"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Artículo
            </label>
            <Select
              value={catalogoId != null ? String(catalogoId) : ""}
              onValueChange={(v) => setCatalogoId(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona artículo" />
              </SelectTrigger>
              <SelectContent>
                {catalogos.map((c) => (
                  <SelectItem
                    key={c.id_catalogo}
                    value={String(c.id_catalogo)}
                  >
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Diagrama
            </label>
            <Select
              disabled={!catalogoId}
              value={diagramaId != null ? String(diagramaId) : ""}
              onValueChange={(v) => setDiagramaId(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    catalogoId
                      ? "Selecciona diagrama"
                      : "Selecciona primero un artículo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {diagramas.map((d) => (
                  <SelectItem
                    key={d.id_diagrama}
                    value={String(d.id_diagrama)}
                  >
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Datos capturados (datos_proceso)
          </h3>

          {}
          {proceso && (
            <div className="border rounded-md p-3 bg-slate-50 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                Agregar nueva medición
              </p>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <label className="block text-xs font-medium mb-1">
                    Fecha
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !newDato.fecha && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDato.fecha
                          ? new Date(newDato.fecha).toLocaleDateString("es-EC")
                          : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          newDato.fecha ? new Date(newDato.fecha + "T00:00:00") : undefined
                        }
                        onSelect={(date) => {
                          if (!date) {
                            setNewDato((p) => ({ ...p, fecha: "" }));
                            return;
                          }
                          const iso = date.toISOString().slice(0, 10); 

                          setNewDato((p) => ({ ...p, fecha: iso }));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Cantidad
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="bg-white"
                    value={newDato.cantidad}
                    onChange={(e) =>
                      setNewDato((p) => ({ ...p, cantidad: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Tiempo total (min:seg)
                  </label>
                  <Input
                    type="text"
                    className="bg-white"
                    placeholder="min:seg (ej. 0:21)"
                    value={newDato.tiempo_min}
                    onChange={(e) => handleMinChange(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Tiempo total (seg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-white"
                    value={newDato.tiempo_seg}
                    onChange={(e) => handleSegChange(e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium mb-1">
                    Operario
                  </label>
                  <Input
                    className="bg-white"
                    value={newDato.operario}
                    onChange={(e) =>
                      setNewDato((p) => ({ ...p, operario: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-12 mt-2">
                  <label className="block text-xs font-medium mb-1">
                    Notas
                  </label>
                  <Input
                    className="bg-white"
                    value={newDato.notas}
                    onChange={(e) =>
                      setNewDato((p) => ({ ...p, notas: e.target.value }))
                    }
                    placeholder="Observaciones, incidencias, etc."
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleCreateDato}
                  disabled={creatingDato}
                >
                  {creatingDato && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Añadir medición
                </Button>
              </div>
            </div>
          )}

          {}
          {datos.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              No hay mediciones registradas para este proceso.
            </div>
          ) : (
            <div className="max-h-64 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Cantidad</th>
                    <th className="text-left p-2">Tiempo total (min)</th>
                    <th className="text-left p-2">Tiempo total (seg)</th>
                    <th className="text-left p-2">Operario</th>
                    <th className="text-left p-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((d) => (
                    <tr key={d.id_medicion} className="border-t">
                      <td className="p-2">{d.fecha}</td>
                      <td className="p-2">{d.cantidad ?? ""}</td>
                      <td className="p-2">{d.tiempo_total_min ?? ""}</td>
                      <td className="p-2">{d.tiempo_total_seg ?? ""}</td>
                      <td className="p-2">{d.operario ?? ""}</td>
                      <td className="p-2">{d.notas ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}