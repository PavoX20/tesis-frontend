// src/pages/Process/MaterialCombobox.tsx
import { useMemo, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import type { Materia } from "@/api/materiasApi"; // <- type-only
import { createMateria } from "@/api/materiasApi";

type Props = {
  materias: Materia[] | unknown;
  value: number | null; // id_materia
  onChange: (id: number | null) => void;
  className?: string;
  unidadValue?: string; // opcional: unidad seleccionada fuera
  onUnidadChange?: (u: string) => void;
};

// tipos y estado
const UNIDADES = ["KG", "M2", "PAR", "UNIDAD"] as const;
type Unidad = (typeof UNIDADES)[number];


export default function MaterialCombobox({
  materias,
  value,
  onChange,
  className,
  unidadValue,
  onUnidadChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState<Materia["unidad"]>("UNIDAD"); // <- union
  const [nuevoTipo, setNuevoTipo] = useState<
    "materia_prima" | "materia_procesada" | "otro"
  >("materia_prima");
  const [costo, setCosto] = useState<string>("0");

  const safeMaterias = Array.isArray(materias) ? materias : [];
  const selected = useMemo(
    () => safeMaterias.find((m) => m.id_materia === value) ?? null, // <- usa safeMaterias
    [safeMaterias, value]
  );

  const handleCreate = async () => {
    if (!nuevoNombre.trim()) return;
    const created = await createMateria({
      nombre: nuevoNombre.trim(),
      unidad: nuevaUnidad, // <- tipo correcto
      tipo: nuevoTipo,
      costo: Number(costo) || 0,
    });
    onChange(created.id_materia);
    setCreateOpen(false);
    setNuevoNombre("");
    setCosto("0");
    setNuevaUnidad("UNIDAD");
    setNuevoTipo("materia_prima");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Combobox de materias */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected ? selected.nombre : "Selecciona materia..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[280px]">
          <Command>
            <CommandInput placeholder="Buscar materia..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {safeMaterias.map((m) => (
                  <CommandItem
                    key={m.id_materia}
                    value={m.nombre}
                    onSelect={() => {
                      onChange(m.id_materia);
                      setOpen(false);
                    }}
                  >
                    {m.nombre}
                  </CommandItem>
                ))}
                <CommandItem
                  key="__crear__"
                  value="__crear__"
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  className="text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear nueva materia…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selector de unidad opcional */}
      {onUnidadChange && (
        <Select
          value={unidadValue ?? selected?.unidad ?? "UNIDAD"}
          onValueChange={onUnidadChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            {UNIDADES.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Dialog crear materia */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva materia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Nombre</Label>
              <Input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label>Unidad</Label>
              <Select
                value={nuevaUnidad}
                onValueChange={(v) => setNuevaUnidad(v as Unidad)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Tipo</Label>
              <Select
                value={nuevoTipo}
                onValueChange={(v: any) => setNuevoTipo(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materia_prima">materia_prima</SelectItem>
                  <SelectItem value="materia_procesada">
                    materia_procesada
                  </SelectItem>
                  <SelectItem value="otro">otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Costo</Label>
              <Input
                type="number"
                step="0.01"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreate} disabled={!nuevoNombre.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
