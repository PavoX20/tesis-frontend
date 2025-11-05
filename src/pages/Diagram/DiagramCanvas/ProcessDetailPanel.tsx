// src/pages/Diagram/DiagramCanvas/ProcessDetailPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectItem, SelectTrigger, SelectContent, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronsUpDown, Check, Plus, Trash2 } from "lucide-react";
import type { AxiosError } from "axios";
import { updateProceso } from "@/api/procesosApi";

// -----------------------------
// Tipos
// -----------------------------
export interface ProcessData {
  label: string;
  procesoId?: number;
  orden?: number;
  distribucion?: string;
  parametros?: string | unknown;
}

interface ProcessDetailPanelProps {
  selectedProcess: ProcessData | null;
  onSaved?: () => void;
}

type Unidad = "M2" | "PAR" | "KG" | "UNIDAD";
type TipoMateria = "materia_prima" | "materia_procesada" | "otro";
type Materia = {
  id_materia: number;
  nombre: string;
  unidad: Unidad;
  costo: number;
  tipo: TipoMateria;
};

type Area = {
  id_area: number;
  nombre: string;
  tipo: "CORTE" | "COSTURA" | "ENSAMBLE" | "OTRO";
  personal: number;
  restriccion: "MIXTO" | "PLANTILLA" | "ESCOLAR";
};

type TipoMaquina = {
  id_tipomaquina: number;
  nombre_maquina: string;
  cantidad_maquinas: number;
  personal_max: number;
  id_area: number | null;
};

type RecetaLineaVM = { materiaId: number | null; cantidad: string };

// -----------------------------
// Mini API con axiosClient
// -----------------------------
// Materias + Receta
async function apiGetMaterias(limit = 1000): Promise<Materia[]> {
  const { data } = await axiosClient.get<Materia[]>(`/materias`, { params: { limit } });
  return Array.isArray(data) ? data : [];
}
async function apiCreateMateria(payload: Omit<Materia, "id_materia">): Promise<Materia> {
  const { data } = await axiosClient.post<Materia>("/materias", payload);
  return data;
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

// Áreas + Tipos de máquina + Proceso-detalle + Patch máquina
async function apiGetAreas(): Promise<Area[]> {
  const { data } = await axiosClient.get<Area[]>("/areas/");
  return Array.isArray(data) ? data : [];
}
async function apiCreateArea(payload: Omit<Area, "id_area">): Promise<Area> {
  const { data } = await axiosClient.post<Area>("/areas/", payload);
  return data;
}
async function apiGetTiposMaquinas(areaId?: number | null): Promise<TipoMaquina[]> {
  const { data } = await axiosClient.get<TipoMaquina[]>("/tipos-maquinas/", {
    params: typeof areaId === "number" ? { area_id: areaId } : {},
  });
  return Array.isArray(data) ? data : [];
}
async function apiCreateTipoMaquina(payload: Omit<TipoMaquina, "id_tipomaquina">): Promise<TipoMaquina> {
  const { data } = await axiosClient.post<TipoMaquina>("/tipos-maquinas/", payload);
  return data;
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

// -----------------------------
// MaterialCombobox
// -----------------------------
function MaterialCombobox({
  materias,
  value,
  onChange,
  onCreated,
  className,
}: {
  materias: Materia[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreated?: (m: Materia) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => materias.find(m => m.id_materia === value) || null, [materias, value]);

  const [dlgOpen, setDlgOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nuevo, setNuevo] = useState<{ nombre: string; unidad: Unidad | ""; tipo: TipoMateria; costo: string }>({
    nombre: "", unidad: "", tipo: "materia_prima", costo: "0",
  });

  const handleCreate = async () => {
    if (!nuevo.nombre.trim() || !nuevo.unidad) return;
    setCreating(true);
    try {
      const created = await apiCreateMateria({
        nombre: nuevo.nombre.trim(),
        unidad: nuevo.unidad as Unidad,
        tipo: nuevo.tipo,
        costo: Number(nuevo.costo || 0),
      });
      onCreated?.(created);
      onChange(created.id_materia);
      setDlgOpen(false);
      setNuevo({ nombre: "", unidad: "", tipo: "materia_prima", costo: "0" });
    } catch (e) {
      console.error("Crear materia falló:", e);
      alert("No se pudo crear la materia.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className={`w-full justify-between ${className ?? ""}`}>
            {selected ? selected.nombre : "Seleccionar materia..."}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[320px]">
          <Command>
            <CommandInput placeholder="Buscar materia..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup heading="Coincidencias">
                {materias.map((m) => (
                  <CommandItem
                    key={m.id_materia}
                    value={`${m.id_materia}-${m.nombre}`}
                    onSelect={() => { onChange(m.id_materia); setOpen(false); }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === m.id_materia ? "opacity-100" : "opacity-0"}`} />
                    {m.nombre} <span className="ml-auto text-xs text-muted-foreground">({m.unidad})</span>
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setDlgOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Crear nueva materia…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent aria-describedby="desc-crear-mat">
          <DialogHeader><DialogTitle>Nueva materia</DialogTitle></DialogHeader>
          <p id="desc-crear-mat" className="sr-only">Crear materia</p>
          <div className="grid gap-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={nuevo.nombre}
                     onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Unidad</Label>
              <div className="col-span-3">
                <Select value={nuevo.unidad} onValueChange={(v) => setNuevo((p) => ({ ...p, unidad: v as Unidad }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona unidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="M2">M2</SelectItem>
                    <SelectItem value="PAR">PAR</SelectItem>
                    <SelectItem value="UNIDAD">UNIDAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Tipo</Label>
              <div className="col-span-3">
                <Select value={nuevo.tipo} onValueChange={(v) => setNuevo((p) => ({ ...p, tipo: v as TipoMateria }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materia_prima">Materia prima</SelectItem>
                    <SelectItem value="materia_procesada">Materia procesada</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Costo</Label>
              <Input className="col-span-3" type="number" min="0" step="0.01"
                     value={nuevo.costo} onChange={(e) => setNuevo((p) => ({ ...p, costo: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlgOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !nuevo.nombre.trim() || !nuevo.unidad}>
              {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------
// AreaCombobox (con crear)
// -----------------------------
function AreaCombobox({
  areas, value, onChange, onCreated, className,
}: {
  areas: Area[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreated?: (a: Area) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => areas.find(a => a.id_area === value) || null, [areas, value]);

  const [dlgOpen, setDlgOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nuevo, setNuevo] = useState<Omit<Area, "id_area">>({
    nombre: "", tipo: "OTRO", personal: 0, restriccion: "MIXTO",
  });

  const handleCreate = async () => {
    if (!nuevo.nombre.trim()) return;
    setCreating(true);
    try {
      const created = await apiCreateArea({
        nombre: nuevo.nombre.trim(),
        tipo: nuevo.tipo,
        personal: Number(nuevo.personal || 0),
        restriccion: nuevo.restriccion,
      });
      onCreated?.(created);
      onChange(created.id_area);
      setDlgOpen(false);
      setNuevo({ nombre: "", tipo: "OTRO", personal: 0, restriccion: "MIXTO" });
    } catch (e) {
      console.error("Crear área falló:", e);
      alert("No se pudo crear el área.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className={`w-full justify-between ${className ?? ""}`}>
            {selected ? selected.nombre : "Seleccionar área..."}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[320px]">
          <Command>
            <CommandInput placeholder="Buscar área..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup heading="Áreas">
                {areas.map((a) => (
                  <CommandItem key={a.id_area} value={`${a.id_area}-${a.nombre}`}
                               onSelect={() => { onChange(a.id_area); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${value === a.id_area ? "opacity-100" : "opacity-0"}`} />
                    {a.nombre} <span className="ml-auto text-xs text-muted-foreground">({a.tipo})</span>
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setDlgOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Crear nueva área…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva área</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={nuevo.nombre}
                     onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Tipo</Label>
              <div className="col-span-3">
                <Select value={nuevo.tipo} onValueChange={(v) => setNuevo((p)=>({ ...p, tipo: v as Area["tipo"] }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORTE">CORTE</SelectItem>
                    <SelectItem value="COSTURA">COSTURA</SelectItem>
                    <SelectItem value="ENSAMBLE">ENSAMBLE</SelectItem>
                    <SelectItem value="OTRO">OTRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Personal</Label>
              <Input className="col-span-3" type="number" min="0" step="1" value={nuevo.personal}
                     onChange={(e) => setNuevo((p) => ({ ...p, personal: Number(e.target.value || 0) }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Restricción</Label>
              <div className="col-span-3">
                <Select value={nuevo.restriccion}
                        onValueChange={(v) => setNuevo((p)=>({ ...p, restriccion: v as Area["restriccion"] }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIXTO">MIXTO</SelectItem>
                    <SelectItem value="PLANTILLA">PLANTILLA</SelectItem>
                    <SelectItem value="ESCOLAR">ESCOLAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlgOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !nuevo.nombre.trim()}>
              {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------
// TipoMaquinaCombobox (filtra por área y permite crear)
// -----------------------------
function TipoMaquinaCombobox({
  maquinas, value, onChange, onCreated,
  areas, onAreaCreated,
  disabled,
  className,
}: {
  maquinas: TipoMaquina[];
  value: number | null;
  onChange: (id: number | null) => void;
  onCreated?: (tm: TipoMaquina) => void;
  areas: Area[];
  onAreaCreated?: (a: Area) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => maquinas.find(m => m.id_tipomaquina === value) || null, [maquinas, value]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nuevo, setNuevo] = useState<Omit<TipoMaquina, "id_tipomaquina">>({
    nombre_maquina: "", cantidad_maquinas: 1, personal_max: 1, id_area: null,
  });

  const handleCreate = async () => {
    if (!nuevo.nombre_maquina.trim()) return;
    setCreating(true);
    try {
      const created = await apiCreateTipoMaquina({
        nombre_maquina: nuevo.nombre_maquina.trim(),
        cantidad_maquinas: Number(nuevo.cantidad_maquinas || 0),
        personal_max: Number(nuevo.personal_max || 0),
        id_area: nuevo.id_area ?? null,
      });
      onCreated?.(created);
      onChange(created.id_tipomaquina);
      setDlgOpen(false);
      setNuevo({ nombre_maquina: "", cantidad_maquinas: 1, personal_max: 1, id_area: null });
    } catch (e) {
      console.error("Crear tipo de máquina falló:", e);
      const msg = (e as any)?.response?.data?.detail ?? "No se pudo crear el tipo de máquina.";
      alert(String(msg));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={!!disabled}
            className={`w-full justify-between ${className ?? ""}`}
          >
            {selected
              ? selected.nombre_maquina
              : (disabled ? "Selecciona un área primero" : "Seleccionar máquina...")}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[360px]">
          <Command>
            <CommandInput placeholder="Buscar máquina..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup heading="Máquinas">
                {maquinas.map((m) => (
                  <CommandItem key={m.id_tipomaquina} value={`${m.id_tipomaquina}-${m.nombre_maquina}`}
                               onSelect={() => { onChange(m.id_tipomaquina); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${value === m.id_tipomaquina ? "opacity-100" : "opacity-0"}`} />
                    {m.nombre_maquina}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {m.id_area ? `Área ${m.id_area}` : "Sin área"}
                    </span>
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setDlgOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Crear nueva máquina…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo tipo de máquina</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={nuevo.nombre_maquina}
                     onChange={(e) => setNuevo((p)=>({ ...p, nombre_maquina: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Cantidad</Label>
              <Input className="col-span-3" type="number" min="0" step="1" value={nuevo.cantidad_maquinas}
                     onChange={(e)=>setNuevo((p)=>({ ...p, cantidad_maquinas: Number(e.target.value || 0)}))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Personal máx</Label>
              <Input className="col-span-3" type="number" min="0" step="1" value={nuevo.personal_max}
                     onChange={(e)=>setNuevo((p)=>({ ...p, personal_max: Number(e.target.value || 0)}))}/>
            </div>
            <div className="grid grid-cols-4 items-start gap-2">
              <Label className="text-right mt-2">Área</Label>
              <div className="col-span-3">
                <AreaCombobox
                  areas={areas}
                  value={nuevo.id_area ?? null}
                  onChange={(id)=>setNuevo((p)=>({ ...p, id_area: id }))}
                  onCreated={onAreaCreated}
                />
                <p className="text-xs text-muted-foreground mt-1">Opcional. Puedes dejarla sin área.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDlgOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !nuevo.nombre_maquina.trim()}>
              {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------
// RecipeSection (lista de líneas)
// -----------------------------
function RecipeSection({
  title, materias, lines, onAdd, onChange, onRemove, onMateriaCreated,
}: {
  title: string;
  materias: Materia[];
  lines: RecetaLineaVM[];
  onAdd: () => void;
  onChange: (idx: number, patch: Partial<RecetaLineaVM>) => void;
  onRemove: (idx: number) => void;
  onMateriaCreated?: (m: Materia) => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>Añadir</Button>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => {
          const mat = materias.find(m => m.id_materia === l.materiaId) || null;
          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <MaterialCombobox
                  materias={materias}
                  value={l.materiaId}
                  onChange={(id) => onChange(i, { materiaId: id })}
                  onCreated={onMateriaCreated}
                />
              </div>
              <div className="col-span-3">
                <Input type="number" min="0.0001" step="0.01" value={l.cantidad}
                       onChange={(e) => onChange(i, { cantidad: e.target.value })} placeholder="Cantidad" />
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">{mat?.unidad ?? "—"}</Badge>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => onRemove(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
        {lines.length === 0 && <div className="text-sm text-muted-foreground">Sin líneas. Usa “Añadir”.</div>}
      </div>
    </div>
  );
}

// -----------------------------
// ProcessDetailPanel (principal)
// -----------------------------
export function ProcessDetailPanel({ selectedProcess, onSaved }: ProcessDetailPanelProps) {
  const [form, setForm] = useState({ label: "", distribucion: "", parametros: [] as string[] });
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

  // track previous area to avoid wiping machine on initial load
  const prevAreaIdRef = useRef<number | null>(null);

  // list filtered by current area as an extra safety layer
  const filteredTmList = useMemo(() => {
    if (!areaId) return tmList;
    return tmList.filter(m => m.id_area === areaId);
  }, [tmList, areaId]);

  const paramsCount: Record<string, number> = { norm: 2, expon: 2, lognorm: 3, gamma: 3, weibull_min: 3 };
  const count = paramsCount[form.distribucion] || 0;

  // Ajuste de parámetros por distribución
  useEffect(() => {
    setForm((prev) => ({ ...prev, parametros: Array.from({ length: count }, (_, i) => prev.parametros[i] ?? "") }));
  }, [count]);

  // Cargar datos al cambiar de proceso
  useEffect(() => {
    if (!selectedProcess?.procesoId) return;

    const parseParams = (raw: unknown): string[] => {
      if (Array.isArray(raw)) return raw.map(String);
      if (typeof raw === "string") {
        try { const v = JSON.parse(raw); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
      }
      return [];
    };

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
        const newEntradas = (receta.entradas || []).map((r) => ({ materiaId: r.id_materia, cantidad: String(r.cantidad ?? "") }));
        const newSalidas  = (receta.salidas  || []).map((r) => ({ materiaId: r.id_materia, cantidad: String(r.cantidad ?? "") }));
        setEntradas(newEntradas); setSalidas(newSalidas);
        setInitEntradas(newEntradas); setInitSalidas(newSalidas);

        setAreas(ars);
        const currentTmId = detalle?.tipo_maquina?.id_tipomaquina ?? null;
        const currentAreaId = detalle?.area?.id_area ?? detalle?.tipo_maquina?.id_area ?? null;
        setTmId(currentTmId);
        setTmIdInitial(currentTmId);
        setAreaId(currentAreaId);

        const list = await apiGetTiposMaquinas(currentAreaId ?? undefined);
        setTmList(list);
        setTmListAreaId(currentAreaId ?? null);
      } catch (e) {
        console.error("Error cargando datos del panel:", e);
        setMaterias([]); setEntradas([]); setSalidas([]);
        setInitEntradas([]); setInitSalidas([]);
        setAreas([]); setTmList([]); setAreaId(null); setTmId(null); setTmIdInitial(null);
      }
    })();
  }, [selectedProcess?.procesoId]);

  // Cambios de área → recargar máquinas y limpiar selección solo si cambia realmente
  useEffect(() => {
    (async () => {
      const list = await apiGetTiposMaquinas(areaId ?? undefined);
      setTmList(list);
      setTmListAreaId(areaId ?? null);
    })();

    // Si ya había un área previa y el usuario cambió a otra, limpiamos la máquina
    if (prevAreaIdRef.current !== null && areaId !== prevAreaIdRef.current) {
      setTmId(null);
    }
    prevAreaIdRef.current = areaId ?? null;
  }, [areaId]);

  // Si la máquina seleccionada no pertenece al área actual, resetear selección
  useEffect(() => {
    if (tmId == null || areaId == null) return;
    // Evitar limpiar si aún no hemos cargado la lista correspondiente al área actual
    if (tmListAreaId !== areaId) return;
    // Evitar limpiar mientras la lista está vacía por carga asíncrona
    if (tmList.length === 0) return;
    const ok = tmList.some(m => m.id_tipomaquina === tmId && m.id_area === areaId);
    if (!ok) setTmId(null);
  }, [tmList, areaId, tmId, tmListAreaId]);

  // Helpers receta
  const addEntrada = () => setEntradas((l) => [...l, { materiaId: null, cantidad: "" }]);
  const addSalida  = () => setSalidas((l) => [...l, { materiaId: null, cantidad: "" }]);
  const patchEntrada = (i:number, p:Partial<RecetaLineaVM>) => setEntradas((l)=> l.map((x,idx)=> idx===i?{...x,...p}:x));
  const patchSalida  = (i:number, p:Partial<RecetaLineaVM>) => setSalidas((l)=> l.map((x,idx)=> idx===i?{...x,...p}:x));
  const removeEntrada = (i:number) => setEntradas((l)=> l.filter((_,idx)=> idx!==i));
  const removeSalida  = (i:number) => setSalidas((l)=> l.filter((_,idx)=> idx!==i));

  // Normalizador receta
  const normalize = (arr: RecetaLineaVM[]) =>
    (Array.isArray(arr) ? arr : [])
      .map(a => ({ id_materia: typeof a.materiaId === "number" ? a.materiaId : NaN, cantidad: Number(a.cantidad) }))
      .filter(a => Number.isFinite(a.id_materia) && Number.isFinite(a.cantidad) && a.cantidad > 0)
      .sort((a, b) => (a.id_materia - b.id_materia) || (a.cantidad - b.cantidad));

  const recetaChanged =
    JSON.stringify(normalize(entradas)) !== JSON.stringify(normalize(initEntradas)) ||
    JSON.stringify(normalize(salidas))  !== JSON.stringify(normalize(initSalidas));

  const formChanged =
    JSON.stringify(form) !== JSON.stringify(initialForm) &&
    form.label.trim() !== "" &&
    form.distribucion.trim() !== "";

  const maquinaChanged = tmId !== tmIdInitial;

  const canSave = (!!selectedProcess?.procesoId) && (formChanged || recetaChanged || maquinaChanged);

  const handleSave = async () => {
    if (!selectedProcess?.procesoId) return;
    setLoading(true);
    try {
      // 1) Proceso
      if (formChanged) {
        const payloadProceso = {
          nombre_proceso: form.label,
          distribucion: form.distribucion || null,
          parametros: JSON.stringify(form.parametros.filter((p) => p !== "")),
        };
        await updateProceso(selectedProcess.procesoId, payloadProceso);
        setInitialForm(form);
      }

      // 2) Receta
      if (recetaChanged) {
        const entradasNorm = normalize(entradas);
        const salidasNorm  = normalize(salidas);
        await apiPutRecetaByProceso(selectedProcess.procesoId, { entradas: entradasNorm, salidas: salidasNorm });
        setInitEntradas(entradas);
        setInitSalidas(salidas);
      }

      // 3) Máquina del proceso
      if (maquinaChanged) {
        await apiPatchProcesoMaquina(selectedProcess.procesoId, tmId ?? null);
        setTmIdInitial(tmId ?? null);
      }

      onSaved?.();
    } catch (err) {
      const ax = err as AxiosError<any>;
      console.error("Error al guardar:");
      console.error("- URL:", ax.config?.baseURL + (ax.config?.url ?? ""));
      console.error("- METHOD:", ax.config?.method?.toUpperCase());
      console.error("- REQUEST DATA:", ax.config?.data);
      console.error("- RESPONSE STATUS:", ax.response?.status);
      console.error("- RESPONSE DATA:", ax.response?.data);
      alert(
        `Error al guardar (${ax.response?.status ?? "?"}). ` +
        `${typeof ax.response?.data === "string" ? ax.response?.data : JSON.stringify(ax.response?.data)}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProcess) {
    return <div className="h-full flex items-center justify-center text-gray-400 italic">Selecciona un proceso para ver detalles</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2">
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

          {count > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Parámetros ({count})</label>
              <div className="flex gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <Input key={i}
                         value={form.parametros[i] || ""}
                         onChange={(e) => {
                           const v = e.target.value;
                           setForm((prev) => {
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
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Área y máquina</h2>
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-6">
              <label className="block text-sm font-medium text-gray-600 mb-1">Área</label>
              <AreaCombobox
                areas={areas}
                value={areaId}
                onChange={setAreaId}
                onCreated={(a)=> setAreas((prev)=> [...prev, a])}
              />
            </div>
            <div className="col-span-6">
              <div className="flex items-end justify-between">
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de máquina</label>
                <Button variant="ghost" size="sm" onClick={() => setTmId(null)} disabled={tmId === null}>Quitar máquina</Button>
              </div>
              <TipoMaquinaCombobox
                maquinas={filteredTmList}
                value={tmId}
                onChange={setTmId}
                onCreated={(tm)=> setTmList((prev)=> [...prev, tm])}
                areas={areas}
                onAreaCreated={(a)=> setAreas((prev)=> [...prev, a])}
                disabled={!areaId}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            La lista de máquinas se filtra por el área seleccionada. Puedes crear nuevos registros desde aquí.
          </p>
        </div>

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
            onMateriaCreated={(m) => setMaterias((prev)=>[...prev, m])}
          />
          <RecipeSection
            title="Salidas"
            materias={materias}
            lines={salidas}
            onAdd={addSalida}
            onChange={patchSalida}
            onRemove={removeSalida}
            onMateriaCreated={(m) => setMaterias((prev)=>[...prev, m])}
          />

          <p className="text-xs text-muted-foreground">
            La unidad se toma de la materia. Para cambiarla, edita la materia.
          </p>
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