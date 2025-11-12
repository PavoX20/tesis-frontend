// src/pages/Datos/EditProcesoDialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil } from "lucide-react";
import type { ProcesoLookupRow as ProcesoLookup } from "@/api/procesosApi";
import { updateProceso } from "@/api/procesosApi";
import { getCatalogos, type Catalogo } from "@/api/catalogoApi";
import { getDiagramasByCatalogo, type Diagrama } from "@/api/diagramaApi";
import { listDatosProceso, type DatoProceso } from "@/api/datosProcesoApi";

// --- helpers ---
function normalizeCatalogList(cats: any): Catalogo[] {
  if (Array.isArray(cats)) return cats;
  if (cats?.data && Array.isArray(cats.data)) return cats.data;
  if (cats?.items && Array.isArray(cats.items)) return cats.items;
  return [];
}

// Asegura que cada medición tenga el campo id_catalogo,
// aunque el backend lo devuelva como catalogo_id
function normalizeDatosCatalogId(ds: any[]): { id_catalogo: number | null }[] {
  return (Array.isArray(ds) ? ds : []).map((d) => ({
    id_catalogo:
      (d as any).id_catalogo ??
      (d as any).catalogo_id ??
      null,
  }));
}

// devuelve el id_catalogo más frecuente (modo) de las mediciones
function mostFrequentCatalogId(datos: { id_catalogo: number | null }[]): number | null {
  const counts = new Map<number, number>();
  for (const d of datos) {
    if (typeof d.id_catalogo === "number") {
      counts.set(d.id_catalogo, (counts.get(d.id_catalogo) ?? 0) + 1);
    }
  }
  let best: number | null = null;
  let bestCount = -1;
  for (const [id, c] of counts) {
    if (c > bestCount) { best = id; bestCount = c; }
  }
  return best;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proceso: ProcesoLookup | null;
  onSaved?: () => void;
};

export default function EditProcesoDialog({ open, onOpenChange, proceso, onSaved }: Props) {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  // combos
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [catalogoId, setCatalogoId] = useState<number | null>(null);

  const [diagramas, setDiagramas] = useState<Diagrama[]>([]);
  const [diagramaId, setDiagramaId] = useState<number | null>(null);

  // datos de mediciones (por si luego quieres mostrarlos/usar más info)
  const [datos, setDatos] = useState<DatoProceso[]>([]);

  // --- CARGA INICIAL (cuando se abre y cambia el proceso) ---
  useEffect(() => {
    if (!open || !proceso) return;

    // setea nombre / articulo / diagrama desde el lookup
    setNombre(proceso.nombre_proceso ?? "");
    setCatalogoId(proceso.catalogo_id ?? null);
    setDiagramaId(proceso.id_diagrama ?? null);

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
          // Si el lookup ya trae artículo, precarga diagramas de ese artículo
          const dias = await getDiagramasByCatalogo(proceso.catalogo_id);
          if (cancel) return;
          setDiagramas(dias);

          // si el diagrama actual ya no pertenece al artículo, resetea
          const stillValid = dias.some(d => d.id_diagrama === (proceso.id_diagrama ?? -1));
          if (!stillValid) setDiagramaId(null);
        } else {
          // Sin artículo en el lookup: sugerir desde datos_proceso
          const datosNorm = normalizeDatosCatalogId(datosProc as any[]);
          const suggested = mostFrequentCatalogId(datosNorm);
          if (suggested != null) {
            setCatalogoId(suggested);
            try {
              const dias = await getDiagramasByCatalogo(suggested);
              if (cancel) return;
              setDiagramas(dias);

              const stillValid = dias.some(d => d.id_diagrama === (proceso.id_diagrama ?? -1));
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

    return () => { cancel = true; };
  }, [open, proceso]);

  // --- cuando cambia el ARTÍCULO, recarga sus diagramas ---
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

        // Si el diagrama seleccionado no pertenece al nuevo artículo, resetea
        const match = dias.some((d) => d.id_diagrama === diagramaId);
        if (!match) setDiagramaId(null);
      } catch {
        if (cancel) return;
        setDiagramas([]);
        setDiagramaId(null);
      }
    })();
    return () => { cancel = true; };
  }, [catalogoId, diagramaId]);

  const canSave = useMemo(() => {
    if (!proceso) return false;
    const nombreChanged   = (nombre ?? "").trim() !== (proceso.nombre_proceso ?? "");
    const diagramaChanged = (diagramaId ?? null) !== (proceso.id_diagrama ?? null);
    // Nota: el "Artículo" se persiste vía diagrama; si cambias artículo pero no eliges diagrama, no hay nada que guardar.
    return nombre.trim().length > 0 && (nombreChanged || diagramaChanged);
  }, [nombre, diagramaId, proceso]);

  async function handleSave() {
    if (!proceso) return;
    setLoading(true);
    try {
      await updateProceso(proceso.id_proceso, {
        nombre_proceso: nombre.trim(),
        id_diagrama: diagramaId ?? null, // al guardar, el artículo queda definido por el diagrama elegido
      });
      onSaved?.();
      onOpenChange(false);
    } catch {
      alert("No se pudo guardar los cambios.");
    } finally {
      setLoading(false);
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
            Cambia el nombre, el artículo y el diagrama al que pertenece este proceso. Abajo verás sus mediciones.
          </DialogDescription>
        </DialogHeader>

        {/* Formulario */}
        <div className="space-y-4">
          {/* Nombre */}
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

          {/* Artículo */}
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
                  <SelectItem key={c.id_catalogo} value={String(c.id_catalogo)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Diagrama (dependiente de artículo) */}
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
                <SelectValue placeholder={catalogoId ? "Selecciona diagrama" : "Selecciona primero un artículo"} />
              </SelectTrigger>
              <SelectContent>
                {diagramas.map((d) => (
                  <SelectItem key={d.id_diagrama} value={String(d.id_diagrama)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Datos de medición */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Datos capturados (datos_proceso)</h3>
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