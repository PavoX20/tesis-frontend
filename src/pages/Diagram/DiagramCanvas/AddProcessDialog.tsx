import { getProcesosLookup } from "@/api/procesosApi";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProcesosPorDiagrama } from "@/api/procesosApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { createDiagrama, getDiagramasPorCatalogo } from "@/api/diagramaApi";

interface AddProcessDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  newNodeName: string;
  setNewNodeName: (value: string) => void;
  insertPos: string;
  setInsertPos: (value: string) => void;
  handleAddNode: (idDiagrama: number | null) => void;
  productId: number;
  nodesLength: number;
}

export function AddProcessDialog({
  open,
  setOpen,
  newNodeName,
  setNewNodeName,
  insertPos,
  setInsertPos,
  handleAddNode,
  productId,
}: AddProcessDialogProps) {
  const [diagramas, setDiagramas] = useState<any[]>([]);
  const [selectedDiagrama, setSelectedDiagrama] = useState<number | null>(null);
  const [nuevoDiagramaNombre, setNuevoDiagramaNombre] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPrincipalAllowed, setIsPrincipalAllowed] = useState(true);
  const [siguientePosicion, setSiguientePosicion] = useState<number | null>(
    null
  );

  const [showAllNames, setShowAllNames] = useState(false);
  const [processNames, setProcessNames] = useState<string[]>([]);
  const [comboOpen, setComboOpen] = useState(false);

  useEffect(() => {
    const fetchDiagramas = async () => {
      try {
        const list = await getDiagramasPorCatalogo(productId); 

        setDiagramas(list);
        const hasPrincipal = list.some((d: any) => Boolean(d.es_principal));
        setIsPrincipalAllowed(!hasPrincipal);
      } catch (error) {
        console.error("Error cargando diagramas:", error);
        setDiagramas([]);
        setIsPrincipalAllowed(true);
      }
    };

    if (open) fetchDiagramas();
  }, [open, productId]);

  useEffect(() => {
  const loadNames = async () => {
    try {
      const params: any = { limit: 100 };
      if (!showAllNames) params.catalogo_id = productId;

      const rows = await getProcesosLookup(params); 

      const names: string[] = Array.from(
        new Set(
          rows
            .map(r => r.nombre_proceso)
            .filter((s): s is string => Boolean(s))
        )
      ).sort((a, b) => a.localeCompare(b, "es"));

      setProcessNames(names);
    } catch {
      setProcessNames([]);
    }
  };
  loadNames();
}, [showAllNames, productId]);

  const handleCreateDiagrama = async (asPrincipal: boolean) => {
    if (!nuevoDiagramaNombre.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        nombre: nuevoDiagramaNombre.trim(),
        descripcion: asPrincipal
          ? "Flujo principal del producto"
          : "Subdiagrama del producto",
        id_catalogo: productId,
        es_principal: asPrincipal,
      };
      const newDiagram = await createDiagrama(payload); 

      setDiagramas((prev) => [...prev, newDiagram]);
      setSelectedDiagrama(newDiagram.id_diagrama);
      setNuevoDiagramaNombre("");

      if (asPrincipal) setIsPrincipalAllowed(false);
    } catch (e: any) {
      setCreateError(e?.response?.data?.detail || "Error creando diagrama");
    } finally {
      setCreating(false);
    }
  };

  const isDisabled =
    !newNodeName.trim() ||
    !insertPos.trim() ||
    Number(insertPos) < 1 ||
    !selectedDiagrama;

  useEffect(() => {
    const fetchProcesos = async () => {
      if (!selectedDiagrama) {
        setSiguientePosicion(null);
        setInsertPos("");
        return;
      }
      try {
        const res = await getProcesosPorDiagrama(selectedDiagrama);
        const procesos = res.procesos || [];
        const siguiente = procesos.length + 1;
        setSiguientePosicion(siguiente);
        setInsertPos(siguiente.toString()); 

      } catch {
        setSiguientePosicion(1);
        setInsertPos("1"); 

      }
    };
    fetchProcesos();
  }, [selectedDiagrama, open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          +
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar nuevo proceso</AlertDialogTitle>
          <AlertDialogDescription>
            Inserta un nuevo proceso dentro de un diagrama de{" "}
            <span className="font-semibold text-blue-600">
              Producto #{productId}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-2">
          {}
          {diagramas.length > 0 ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Diagrama</Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => {
                    setSelectedDiagrama(value ? Number(value) : null);
                    setInsertPos("");
                  }}
                  value={selectedDiagrama ? String(selectedDiagrama) : ""}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Selecciona diagrama" />
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
          ) : (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
              No hay diagramas creados para este producto.
              <br />
              Crea el diagrama principal primero.
            </div>
          )}

          {}
          <div className="border-t pt-2 mt-2">
            <Label className="text-sm font-semibold mb-1 block">
              Crear nuevo diagrama
            </Label>
            <Input
              placeholder={
                isPrincipalAllowed
                  ? "Nombre diagrama principal"
                  : "Nombre subdiagrama (ej: SUELA, CORTE, etc.)"
              }
              value={nuevoDiagramaNombre}
              onChange={(e) => setNuevoDiagramaNombre(e.target.value)}
            />
            {createError && (
              <p className="text-xs text-red-600 mt-1">{createError}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="secondary"
                className={`text-sm ${
                  isPrincipalAllowed
                    ? "hover:bg-blue-100"
                    : "cursor-not-allowed opacity-60"
                }`}
                title={
                  isPrincipalAllowed
                    ? "Crear diagrama principal"
                    : "Ya existe un principal"
                }
                onClick={() => handleCreateDiagrama(true)}
                disabled={
                  !isPrincipalAllowed || creating || !nuevoDiagramaNombre.trim()
                }
              >
                {creating ? "Creando..." : "Crear principal"}
              </Button>
              <Button
                variant="outline"
                className="text-sm hover:bg-blue-50"
                title="Crear subdiagrama"
                onClick={() => handleCreateDiagrama(false)}
                disabled={creating || !nuevoDiagramaNombre.trim()}
              >
                {creating ? "Creando..." : "Crear subdiagrama"}
              </Button>
            </div>
          </div>

          {}
          {}
          <div className="grid grid-cols-4 items-center gap-4 mt-4">
            <Label className="text-right">Nombre del Proceso</Label>
            <div className="col-span-3 flex flex-col gap-2">
              <Popover open={comboOpen} onOpenChange={setComboOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between"
                    title="Selecciona un nombre de proceso existente o escribe uno nuevo"
                  >
                    {newNodeName || "Selecciona o escribe un nombre"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 z-50"
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  <Command>
                    <CommandInput placeholder="Buscar nombre..." />
                    <CommandEmpty>No hay coincidencias.</CommandEmpty>
                    <ScrollArea className="max-h-64">
                      <CommandList>
                        <CommandGroup>
                          {processNames.map((name) => (
                            <CommandItem
                              key={name}
                              onSelect={() => {
                                setNewNodeName(name);
                                setComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newNodeName === name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                size="sm"
                variant={showAllNames ? "default" : "secondary"}
                className={`self-start px-3 py-1 text-xs ${showAllNames ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                onClick={() => setShowAllNames((v) => !v)}
                title={
                  showAllNames
                    ? "Mostrar solo de este producto"
                    : "Mostrar todos los procesos"
                }
              >
                {showAllNames ? "Mostrar solo de este producto" : "Mostrar todos los procesos"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nodePosition" className="text-right">
              Posición
            </Label>
            <Input
              id="nodePosition"
              className="col-span-3"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={
                selectedDiagrama && siguientePosicion
                  ? `1 - ${siguientePosicion}`
                  : ""
              }
              value={insertPos}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^[0-9]+$/.test(val)) setInsertPos(val);
              }}
              disabled={
                !selectedDiagrama ||
                (siguientePosicion !== null && siguientePosicion <= 1)
              }
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDisabled}
            onClick={() => handleAddNode(selectedDiagrama)} 

          >
            Crear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

