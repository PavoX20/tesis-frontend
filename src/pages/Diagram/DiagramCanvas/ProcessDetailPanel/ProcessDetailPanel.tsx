// src/pages/Diagram/DiagramCanvas/ProcessDetailPanel/ProcessDetailPanel.tsx
import { useEffect, useRef, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import type { AxiosError } from "axios";
import { updateProceso } from "@/api/procesosApi";
import { AreaMachineSection } from "./AreaMachineSection";
import { RecipeSection } from "./RecipeSection";

// -------- Tipos locales ----------
export interface ProcessData {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string | unknown;
}
type Unidad = "M2" | "PAR" | "KG" | "UNIDAD";
type TipoMateria = "materia_prima" | "materia_procesada" | "otro";
type Materia = { id_materia: number; nombre: string; unidad: Unidad; costo: number; tipo: TipoMateria; };
type Area = { id_area: number; nombre: string; tipo: "CORTE" | "COSTURA" | "ENSAMBLE" | "OTRO"; personal: number; restriccion: "MIXTO" | "PLANTILLA" | "ESCOLAR"; };
type TipoMaquina = { id_tipomaquina: number; nombre_maquina: string; cantidad_maquinas: number; personal_max: number; id_area: number | null; };
type RecetaLineaVM = { materiaId: number | null; cantidad: string };

interface ProcessDetailPanelProps {
  selectedProcess: ProcessData | null;
  onSaved?: () => void;
}

// -------- Mini API ----------
async function apiGetMaterias(limit = 1000): Promise<Materia[]> {
  const { data } = await axiosClient.get<Materia[]>("/materias", { params: { limit } });
  return Array.isArray(data) ? data : [];
}
async function apiGetRecetaByProceso(id_proceso: number): Promise<{
  entradas: Array<{ id_materia: number; cantidad: number; materia_nombre: string; unidad: Unidad }>;
  salidas: Array<{ id_materia: number; cantidad: number; materia_nombre: string; unidad: Unidad }>;
}> {
  const { data } = await axiosClient.get(`/receta/proceso/${id_proceso}`);
  return {
    entradas: Array.isArray(data?.entradas) ? data.entradas : [],
    salidas: Array.isArray(data?.salidas) ? data.salidas : [],
  };
}
async function apiPutRecetaByProceso(
  id_proceso: number,
  payload: { entradas: Array<{ id_materia: number; cantidad: number }>; salidas: Array<{ id_materia: number; cantidad: number }> }
) {
  const { data } = await axiosClient.put(`/receta/proceso/${id_proceso}`, payload);
  return data;
}
async function apiGetAreas(): Promise<Area[]> {
  const { data } = await axiosClient.get<Area[]>("/areas/");
  return Array.isArray(data) ? data : [];
}
async function apiGetTiposMaquinas(areaId?: number | null): Promise<TipoMaquina[]> {
  const { data } = await axiosClient.get<TipoMaquina[]>("/tipos-maquinas/", {
    params: typeof areaId === "number" ? { area_id: areaId } : {},
  });
  return Array.isArray(data) ? data : [];
}
async function apiPatchProcesoMaquina(procesoId: number, id_tipomaquina: number | null) {
  const { data } = await axiosClient.patch(`/procesos/${procesoId}/maquina`, { id_tipomaquina });
  return data as { id_proceso: number; id_tipomaquina: number | null };
}
async function apiGetProcesoDetalle(procesoId: number): Promise<{
  proceso: any;
  tipo_maquina: (TipoMaquina & { id_tipomaquina: number }) | null;
  area: Area | null;
}> {
  const { data } = await axiosClient.get(`/procesos-detalle/${procesoId}`);
  return data;
}

// -------- Helpers ----------
const PARAMS_COUNT: Record<string, number> = { norm: 2, expon: 2, lognorm: 3, gamma: 3, weibull_min: 3 };
const parseParams = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
  }
  return [];
};
const normalize = (arr: RecetaLineaVM[]) =>
  (Array.isArray(arr) ? arr : [])
    .map(a => ({ id_materia: typeof a.materiaId === "number" ? a.materiaId : NaN, cantidad: Number(a.cantidad) }))
    .filter(a => Number.isFinite(a.id_materia) && Number.isFinite(a.cantidad) && a.cantidad > 0)
    .sort((a, b) => (a.id_materia - b.id_materia) || (a.cantidad - b.cantidad));

// -------- Componente ----------
export function ProcessDetailPanel({ selectedProcess, onSaved }: ProcessDetailPanelProps) {
  const [form, setForm] = useState<{ label: string; distribucion: string; parametros: string[] }>({ label: "", distribucion: "", parametros: [] });
  const [initialForm, setInitialForm] = useState(form);
  const [loading, setLoading] = useState(false);

  // receta
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entradas, setEntradas] = useState<RecetaLineaVM[]>([]);
  const [salidas, setSalidas] = useState<RecetaLineaVM[]>([]);
  const [initEntradas, setInitEntradas] = useState<RecetaLineaVM[]>([]);
  const [initSalidas, setInitSalidas] = useState<RecetaLineaVM[]>([]);

  // áreas y máquinas
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [tmList, setTmList] = useState<TipoMaquina[]>([]);
  const [tmId, setTmId] = useState<number | null>(null);
  const [tmIdInitial, setTmIdInitial] = useState<number | null>(null);
  const [tmListAreaId, setTmListAreaId] = useState<number | null>(null);
  const prevAreaIdRef = useRef<number | null>(null);

  const paramsCount = PARAMS_COUNT[form.distribucion] || 0;

  useEffect(() => {
    setForm(prev => ({ ...prev, parametros: Array.from({ length: paramsCount }, (_, i) => prev.parametros[i] ?? "") }));
  }, [paramsCount]);

  // carga por proceso
  useEffect(() => {
    if (!selectedProcess?.procesoId) return;

    const initial = {
      label: selectedProcess.label || "",
      distribucion: selectedProcess.distribucion || "",
      parametros: parseParams(selectedProcess.parametros),
    };
    setForm(initial);
    setInitialForm(initial);

    (async () => {
      try {
        const [mats, receta, ars, detalle] = await Promise.all([
          apiGetMaterias(),
          apiGetRecetaByProceso(selectedProcess.procesoId!),
          apiGetAreas(),
          apiGetProcesoDetalle(selectedProcess.procesoId!),
        ]);

        setMaterias(mats);
        const newEntradas = (receta.entradas || []).map(r => ({ materiaId: r.id_materia, cantidad: String(r.cantidad ?? "") }));
        const newSalidas  = (receta.salidas  || []).map(r => ({ materiaId: r.id_materia, cantidad: String(r.cantidad ?? "") }));
        setEntradas(newEntradas); setSalidas(newSalidas);
        setInitEntradas(newEntradas); setInitSalidas(newSalidas);

        setAreas(ars);
        const currentTmId   = detalle?.tipo_maquina?.id_tipomaquina ?? null;
        const currentAreaId = detalle?.area?.id_area ?? detalle?.tipo_maquina?.id_area ?? null;
        setTmId(currentTmId); setTmIdInitial(currentTmId); setAreaId(currentAreaId);

        const list = await apiGetTiposMaquinas(currentAreaId ?? undefined);
        setTmList(list); setTmListAreaId(currentAreaId ?? null);
      } catch {
        setMaterias([]); setEntradas([]); setSalidas([]);
        setInitEntradas([]); setInitSalidas([]);
        setAreas([]); setTmList([]); setAreaId(null); setTmId(null); setTmIdInitial(null);
      }
    })();
  }, [selectedProcess?.procesoId]);

  // recarga lista al cambiar área
  useEffect(() => {
    (async () => {
      const list = await apiGetTiposMaquinas(areaId ?? undefined);
      setTmList(list);
      setTmListAreaId(areaId ?? null);
    })();

    if (prevAreaIdRef.current !== null && areaId !== prevAreaIdRef.current) setTmId(null);
    prevAreaIdRef.current = areaId ?? null;
  }, [areaId]);

  // valida máquina vs área (evita “Seleccionar máquina…” tras guardar)
  useEffect(() => {
    if (tmId == null || areaId == null) return;
    if (tmListAreaId !== areaId) return;
    if (tmList.length === 0) return;
    const ok = tmList.some(m => m.id_tipomaquina === tmId && m.id_area === areaId);
    if (!ok) setTmId(null);
  }, [tmList, areaId, tmId, tmListAreaId]);

  // receta helpers
  const addEntrada = () => setEntradas(l => [...l, { materiaId: null, cantidad: "" }]);
  const addSalida  = () => setSalidas(l  => [...l, { materiaId: null, cantidad: "" }]);
  const patchEntrada = (i:number, p:Partial<RecetaLineaVM>) => setEntradas(l=> l.map((x,idx)=> idx===i?{...x,...p}:x));
  const patchSalida  = (i:number, p:Partial<RecetaLineaVM>) => setSalidas(l => l.map((x,idx)=> idx===i?{...x,...p}:x));
  const removeEntrada = (i:number) => setEntradas(l=> l.filter((_,idx)=> idx!==i));
  const removeSalida  = (i:number) => setSalidas(l => l.filter((_,idx)=> idx!==i));

  const recetaChanged =
    JSON.stringify(normalize(entradas)) !== JSON.stringify(normalize(initEntradas)) ||
    JSON.stringify(normalize(salidas))  !== JSON.stringify(normalize(initSalidas));

  const formChanged =
    JSON.stringify(form) !== JSON.stringify(initialForm) &&
    form.label.trim() !== "" && form.distribucion.trim() !== "";

  const maquinaChanged = tmId !== tmIdInitial;
  const canSave = (!!selectedProcess?.procesoId) && (formChanged || recetaChanged || maquinaChanged);

  const handleSave = async () => {
    if (!selectedProcess?.procesoId) return;
    setLoading(true);
    try {
      if (formChanged) {
        await updateProceso(selectedProcess.procesoId, {
          nombre_proceso: form.label,
          distribucion: form.distribucion || null,
          parametros: JSON.stringify(form.parametros.filter((p) => p !== "")),
        });
        setInitialForm(form);
      }
      if (recetaChanged) {
        await apiPutRecetaByProceso(selectedProcess.procesoId, {
          entradas: normalize(entradas), salidas: normalize(salidas),
        });
        setInitEntradas(entradas); setInitSalidas(salidas);
      }
      if (maquinaChanged) {
        await apiPatchProcesoMaquina(selectedProcess.procesoId, tmId ?? null);
        setTmIdInitial(tmId ?? null);
      }
      onSaved?.();
    } catch (err) {
      const ax = err as AxiosError<any>;
      alert(`Error al guardar (${ax.response?.status ?? "?"}). ${
        typeof ax.response?.data === "string" ? ax.response?.data : JSON.stringify(ax.response?.data)
      }`);
    } finally { setLoading(false); }
  };

  if (!selectedProcess) {
    return <div className="h-full flex items-center justify-center text-gray-400 italic">Selecciona un proceso para ver detalles</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Meta */}
        <div className="space-y-4 pb-4 border-b border-gray-200 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Detalles del Proceso</h2>
          <p className="text-sm text-gray-500">Edita la información del proceso seleccionado</p>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Orden</label>
            <Input value={selectedProcess.orden ?? ""} disabled className="bg-gray-100 text-gray-700 border-gray-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del Proceso</label>
            <Input
              value={form.label}
              onChange={(e) => setForm((p)=>({ ...p, label: e.target.value }))}
              className="bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300"
              placeholder="Nombre del proceso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Distribución</label>
            <Select value={form.distribucion} onValueChange={(value) => setForm((p)=>({ ...p, distribucion: value }))}>
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

          {paramsCount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Parámetros ({paramsCount})</label>
              <div className="flex gap-2">
                {Array.from({ length: paramsCount }).map((_, i) => (
                  <Input key={i}
                    value={form.parametros[i] || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm(prev => {
                        const updated = [...prev.parametros];
                        updated[i] = v;
                        return { ...prev, parametros: updated };
                      });
                    }}
                    placeholder={`Parámetro ${i + 1}`}
                    className="bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-300 w-1/3 text-sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Área y Máquina */}
        <AreaMachineSection
          areas={areas}
          areaId={areaId}
          setAreaId={setAreaId}
          onAreaCreated={(a)=> setAreas(prev => [...prev, a])}
          maquinas={tmList}
          tmId={tmId}
          setTmId={setTmId}
          onMaquinaCreated={(tm)=> setTmList(prev => [...prev, tm])}
          disabledMachine={!areaId}
        />

        <Separator className="my-6" />

        {/* Receta */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Receta del proceso</h2>
          <RecipeSection
            title="Entradas"
            materias={materias}
            lines={entradas}
            onAdd={addEntrada}
            onChange={patchEntrada}
            onRemove={removeEntrada}
            onMateriaCreated={(m) => setMaterias(prev=>[...prev, m])}
          />
          <RecipeSection
            title="Salidas"
            materias={materias}
            lines={salidas}
            onAdd={addSalida}
            onChange={patchSalida}
            onRemove={removeSalida}
            onMateriaCreated={(m) => setMaterias(prev=>[...prev, m])}
          />
          <p className="text-xs text-muted-foreground">La unidad se toma de la materia. Para cambiarla, edita la materia.</p>
        </div>

        <div className="mt-8 h-[250px] border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-sm">
          Aquí irá el gráfico del proceso
        </div>
      </div>

      <div className="border-t pt-3 mt-2 bg-white flex justify-end">
        <Button onClick={handleSave} disabled={!canSave || loading}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm">
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}