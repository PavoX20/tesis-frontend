import { useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Area = { id_area: number; nombre: string; tipo: "CORTE" | "COSTURA" | "ENSAMBLE" | "OTRO"; personal: number; restriccion: "MIXTO" | "PLANTILLA" | "ESCOLAR"; };
type TipoMaquina = { id_tipomaquina: number; nombre_maquina: string; cantidad_maquinas: number; personal_max: number; id_area: number | null; };

export function AreaMachineSection({
  areas, areaId, setAreaId, onAreaCreated,
  maquinas, tmId, setTmId, onMaquinaCreated,
  disabledMachine,
}: {
  areas: Area[];
  areaId: number | null;
  setAreaId: (id: number | null) => void;
  onAreaCreated: (a: Area) => void;

  maquinas: TipoMaquina[];
  tmId: number | null;
  setTmId: (id: number | null) => void;
  onMaquinaCreated: (tm: TipoMaquina) => void;

  disabledMachine: boolean;
}) {

  function AreaCombobox({ areas, value, onChange }: {
    areas: Area[]; value: number | null; onChange: (id: number | null) => void;
  }) {
    const [open, setOpen] = useState(false);
    const selected = useMemo(() => areas.find(a => a.id_area === value) || null, [areas, value]);

    const [dlgOpen, setDlgOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [nuevo, setNuevo] = useState<Omit<Area, "id_area">>({
      nombre: "", tipo: "OTRO", personal: 0, restriccion: "MIXTO",
    });

    const createArea = async () => {
      if (!nuevo.nombre.trim()) return;
      setCreating(true);
      try {
        const { data } = await axiosClient.post<Area>("/areas/", {
          ...nuevo, personal: Number(nuevo.personal || 0),
        });
        onAreaCreated(data);
        onChange(data.id_area);
        setDlgOpen(false);
        setNuevo({ nombre: "", tipo: "OTRO", personal: 0, restriccion: "MIXTO" });
      } finally { setCreating(false); }
    };

    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
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
                  {areas.map(a => (
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
                  onChange={(e)=>setNuevo(p=>({...p, nombre:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Tipo</Label>
                <div className="col-span-3">
                  <Select value={nuevo.tipo} onValueChange={(v)=>setNuevo(p=>({...p, tipo:v as Area["tipo"]}))}>
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
                  onChange={(e)=>setNuevo(p=>({...p, personal:Number(e.target.value || 0)}))}/>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Restricción</Label>
                <div className="col-span-3">
                  <Select value={nuevo.restriccion}
                    onValueChange={(v)=>setNuevo(p=>({...p, restriccion:v as Area["restriccion"]}))}>
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
              <Button variant="ghost" onClick={()=>setDlgOpen(false)}>Cancelar</Button>
              <Button onClick={createArea} disabled={creating || !nuevo.nombre.trim()}>
                {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  function TipoMaquinaCombobox({
    maquinas, value, onChange, disabled,
  }: {
    maquinas: TipoMaquina[]; value: number | null;
    onChange: (id: number | null) => void; disabled?: boolean;
  }) {
    const [open, setOpen] = useState(false);
    const selected = useMemo(() => maquinas.find(m => m.id_tipomaquina === value) || null, [maquinas, value]);

    const [dlgOpen, setDlgOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [nuevo, setNuevo] = useState<Omit<TipoMaquina, "id_tipomaquina">>({
      nombre_maquina: "", cantidad_maquinas: 1, personal_max: 1, id_area: areaId ?? null,
    });

    const createTM = async () => {
      if (!nuevo.nombre_maquina.trim()) return;
      setCreating(true);
      try {
        const { data } = await axiosClient.post<TipoMaquina>("/tipos-maquinas/", {
          ...nuevo,
          cantidad_maquinas: Number(nuevo.cantidad_maquinas || 0),
          personal_max: Number(nuevo.personal_max || 0),
          id_area: nuevo.id_area ?? null,
        });
        onMaquinaCreated(data);
        onChange(data.id_tipomaquina);
        setDlgOpen(false);
        setNuevo({ nombre_maquina: "", cantidad_maquinas: 1, personal_max: 1, id_area: areaId ?? null });
      } finally { setCreating(false); }
    };

    const filtered = useMemo(
      () => (areaId ? maquinas.filter(m => m.id_area === areaId) : maquinas),
      [maquinas, areaId],
    );

    return (
      <>
        <Popover open={open} onOpenChange={(v)=>!disabled && setOpen(v)}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} disabled={!!disabled} className="w-full justify-between">
              {selected ? selected.nombre_maquina : (disabled ? "Selecciona un área primero" : "Seleccionar máquina...")}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[360px]">
            <Command>
              <CommandInput placeholder="Buscar máquina..." />
              <CommandList>
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup heading="Máquinas">
                  {filtered.map(m => (
                    <CommandItem key={m.id_tipomaquina} value={`${m.id_tipomaquina}-${m.nombre_maquina}`}
                      onSelect={() => { onChange(m.id_tipomaquina); setOpen(false); }}>
                      <Check className={`mr-2 h-4 w-4 ${value === m.id_tipomaquina ? "opacity-100" : "opacity-0"}`} />
                      {m.nombre_maquina}
                      <span className="ml-auto text-xs text-muted-foreground">{m.id_area ? `Área ${m.id_area}` : "Sin área"}</span>
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
                  onChange={(e)=>setNuevo(p=>({...p, nombre_maquina:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Cantidad</Label>
                <Input className="col-span-3" type="number" min="0" step="1" value={nuevo.cantidad_maquinas}
                  onChange={(e)=>setNuevo(p=>({...p, cantidad_maquinas:Number(e.target.value || 0)}))}/>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Personal máx</Label>
                <Input className="col-span-3" type="number" min="0" step="1" value={nuevo.personal_max}
                  onChange={(e)=>setNuevo(p=>({...p, personal_max:Number(e.target.value || 0)}))}/>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Área</Label>
                <Input className="col-span-3" value={areaId ?? ""} disabled />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={()=>setDlgOpen(false)}>Cancelar</Button>
              <Button onClick={createTM} disabled={creating || !nuevo.nombre_maquina.trim()}>
                {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Área y máquina</h2>
      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">Área</label>
          <AreaCombobox areas={areas} value={areaId} onChange={setAreaId} />
        </div>
        <div className="col-span-6">
          <div className="flex items-end justify-between">
            <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de máquina</label>
            <Button variant="ghost" size="sm" onClick={() => setTmId(null)} disabled={tmId === null}>Quitar máquina</Button>
          </div>
          <TipoMaquinaCombobox
            maquinas={maquinas}
            value={tmId}
            onChange={setTmId}
            disabled={disabledMachine}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La lista de máquinas se filtra por el área seleccionada. Puedes crear nuevos registros desde aquí.
      </p>
    </div>
  );
}