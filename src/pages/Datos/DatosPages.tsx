// src/pages/Datos/DatosPages.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2 } from "lucide-react";
import { getProcesosLookup, deleteProceso } from "@/api/procesosApi";
import type { ProcesoLookupRow } from "@/api/procesosApi";
import { getCatalogos } from "@/api/catalogoApi";
import EditProcesoDialog from "./EditProcesoDialog";

// type ProcesoLookup = {
//   id_proceso: number;
//   nombre_proceso: string;
//   orden?: number | null;
//   id_diagrama: number;
//   tipo?: string | null;
//   diagrama_nombre?: string | null;
//   catalogo_id?: number | null;
//   catalogo_nombre?: string | null;
// };

// Encuentra un array de objetos en el payload (hasta 3 niveles)
function findArrayDeep(obj: any, depth = 0): any[] | null {
  if (!obj || depth > 3) return null;
  if (Array.isArray(obj)) return obj;

  if (typeof obj === "object") {
    // pistas comunes primero
    const candidates = [
      obj.data,
      obj.items,
      obj.rows,
      obj.result,
      obj.payload,
      obj.procesos,
      obj.list,
    ].filter(Boolean);

    for (const c of candidates) {
      const found = findArrayDeep(c, depth + 1);
      if (found) return found;
    }

    // si nada anterior, escanear todas las propiedades
    for (const v of Object.values(obj)) {
      const found = findArrayDeep(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function toLookupArray(input: any): ProcesoLookupRow[] {
  const arr = findArrayDeep(input) ?? [];
  const rows = arr
    .filter(Boolean)
    .map((r: any) => ({
      id_proceso: Number(r.id_proceso ?? r.id ?? r.proceso_id),
      nombre_proceso: String(r.nombre_proceso ?? r.nombre ?? r.proceso ?? ""),
      orden: r.orden ?? null,
      id_diagrama: (r.id_diagrama ?? r.diagrama_id ?? r.id_flujo ?? null),
      tipo: r.tipo ?? null,
      diagrama_nombre: r.diagrama_nombre ?? r.diagrama ?? r.nombre_diagrama ?? null,
      catalogo_id: r.catalogo_id ?? r.id_catalogo ?? r.catalogo ?? null,
      catalogo_nombre: r.catalogo_nombre ?? r.nombre_catalogo ?? r.articulo ?? null,
    }))
    .filter((x: ProcesoLookupRow) => Number.isFinite(x.id_proceso));

  return rows;
}

export default function DatosPages() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ProcesoLookupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<ProcesoLookupRow | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [catalogNameById, setCatalogNameById] = useState<Record<number, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Para depurar la respuesta cruda cuando no hay filas
  const [rawPayload, setRawPayload] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getCatalogos();
        const map: Record<number, string> = {};
        for (const c of Array.isArray(list) ? list : []) {
          if (typeof c.id_catalogo === "number" && typeof c.nombre === "string") {
            map[c.id_catalogo] = c.nombre;
          }
        }
        setCatalogNameById(map);
      } catch {
        setCatalogNameById({});
      }
    })();
  }, []);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(initial = false) {
    setLoading(true);
    setErrorMsg(null);
    setRawPayload(null);
    try {
      const data = await getProcesosLookup({
        q: initial ? undefined : search,
        limit: 100,
      });

      setRawPayload(data); // guardamos crudo para depurar si hiciera falta
      const normalized = toLookupArray(data);
      setRows(normalized);

      if (normalized.length === 0) {
        // ayuda visual para detectar formatos inesperados
        // eslint-disable-next-line no-console
        console.debug("[Datos] /procesos/lookup payload crudo:", data);
      }
    } catch (e: any) {
      const msg = e?.response?.data
        ? typeof e.response.data === "string"
          ? e.response.data
          : JSON.stringify(e.response.data)
        : e?.message || "Error desconocido";
      setErrorMsg(`Error al cargar procesos: ${msg}`);
      setRows([]);
      // eslint-disable-next-line no-console
      console.error("getProcesosLookup failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await load(false);
  }

  async function handleDeleteProceso(id_proceso: number) {
    if (!id_proceso) return;
    const ok = window.confirm("¿Eliminar este proceso? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      setDeletingId(id_proceso);
      await deleteProceso(id_proceso);
      setRows(prev => prev.filter(p => p.id_proceso !== id_proceso));
    } catch (e: any) {
      const msg = e?.response?.data
        ? (typeof e.response.data === "string" ? e.response.data : JSON.stringify(e.response.data))
        : (e?.message || "Error desconocido");
      setErrorMsg(`No se pudo eliminar: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Datos</h1>
      <p className="text-sm text-muted-foreground">
        Lista de procesos con su artículo y diagrama. Haz clic en el lápiz para
        editar y ver datos de mediciones.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Buscar proceso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch("");
            load(true);
          }}
        >
          Limpiar
        </Button>
        {/* botón de depuración opcional */}
        <Button
          type="button"
          variant="ghost"
          className="ml-auto"
          onClick={() => setShowRaw(v => !v)}
        >
          {showRaw ? "Ocultar debug" : "Ver debug"}
        </Button>
      </form>

      {showRaw && rawPayload && (
        <div className="text-xs bg-gray-50 border rounded p-2 max-h-64 overflow-auto">
          <div className="font-semibold mb-1">Respuesta cruda /procesos/lookup</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </div>
      )}

      {errorMsg && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
          {errorMsg}
        </div>
      )}

      <Separator />

      <div className="border rounded overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b">
              <th className="text-left p-2 w-10">Acción</th>
              <th className="text-left p-2">Proceso</th>
              <th className="text-left p-2">Artículo</th>
              <th className="text-left p-2">Diagrama</th>
              <th className="text-left p-2">Orden</th>
              <th className="text-left p-2">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Cargando procesos…
                </td>
              </tr>
            )}

            {!loading && rows.map((r) => (
              <tr key={r.id_proceso} className="border-b hover:bg-muted/20">
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(r);
                        setOpenDialog(true);
                      }}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProceso(r.id_proceso)}
                      title="Eliminar"
                      disabled={deletingId === r.id_proceso}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </td>
                <td className="p-2">{r.nombre_proceso}</td>
                <td className="p-2">{r.catalogo_nombre || (r.catalogo_id && catalogNameById[r.catalogo_id]) || "-"}</td>
                <td className="p-2">{r.diagrama_nombre ?? "-"}</td>
                <td className="p-2">{r.orden ?? "-"}</td>
                <td className="p-2">{r.tipo ?? "-"}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 && !errorMsg && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No hay procesos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditProcesoDialog
        open={openDialog}
        onOpenChange={(v) => setOpenDialog(v)}
        proceso={editing}
        onSaved={() => load()}
      />
    </div>
  );
}