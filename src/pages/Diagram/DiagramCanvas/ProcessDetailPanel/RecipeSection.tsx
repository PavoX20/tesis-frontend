// src/pages/Diagram/DiagramCanvas/ProcessDetailPanel/RecipeSection.tsx
import { useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react";

type Unidad = "M2" | "PAR" | "KG" | "UNIDAD";
type TipoMateria = "materia_prima" | "materia_procesada" | "otro";
type Materia = { id_materia: number; nombre: string; unidad: Unidad; costo: number; tipo: TipoMateria; };
type RecetaLineaVM = { materiaId: number | null; cantidad: string };

function MaterialCombobox({
  materias, value, onChange, onCreated,
}: {
  materias: Materia[]; value: number | null; onChange: (id: number | null) => void; onCreated?: (m: Materia) => void;
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
      const { data } = await axiosClient.post<Materia>("/materias", {
        nombre: nuevo.nombre.trim(),
        unidad: nuevo.unidad as Unidad,
        tipo: nuevo.tipo,
        costo: Number(nuevo.costo || 0),
      });
      onCreated?.(data);
      onChange(data.id_materia);
      setDlgOpen(false);
      setNuevo({ nombre: "", unidad: "", tipo: "materia_prima", costo: "0" });
    } finally { setCreating(false); }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
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
                {materias.map(m => (
                  <CommandItem key={m.id_materia} value={`${m.id_materia}-${m.nombre}`}
                    onSelect={()=>{ onChange(m.id_materia); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${value === m.id_materia ? "opacity-100" : "opacity-0"}`} />
                    {m.nombre} <span className="ml-auto text-xs text-muted-foreground">({m.unidad})</span>
                  </CommandItem>
                ))}
                <CommandItem onSelect={()=>setDlgOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Crear nueva materia…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva materia</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Nombre</Label>
              <Input className="col-span-3" value={nuevo.nombre}
                onChange={(e)=>setNuevo(p=>({...p, nombre:e.target.value}))}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Unidad</Label>
              <div className="col-span-3">
                <Select value={nuevo.unidad} onValueChange={(v)=>setNuevo(p=>({...p, unidad:v as Unidad}))}>
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
                <Select value={nuevo.tipo} onValueChange={(v)=>setNuevo(p=>({...p, tipo:v as TipoMateria}))}>
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
                value={nuevo.costo} onChange={(e)=>setNuevo(p=>({...p, costo:e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setDlgOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !nuevo.nombre.trim() || !nuevo.unidad}>
              {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RecipeSection({
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