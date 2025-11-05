// src/pages/Process/RecipeSection.tsx
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Materia } from "@/api/materiasApi"; // <- type-only
import MaterialCombobox from "./MaterialCombobox";

export type RecipeLineVM = { materiaId: number | null; cantidad: string; unidad?: string };

type Props = {
  title: string;
  materias: Materia[];
  lines: RecipeLineVM[];
  onAdd: () => void;
  onChange: (index: number, patch: Partial<RecipeLineVM>) => void;
  onRemove: (index: number) => void;
};

export default function RecipeSection({ title, materias, lines, onAdd, onChange, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          Añadir
        </Button>
      </div>

      <div className="space-y-2">
        {lines.map((ln, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-7">
              <MaterialCombobox
                materias={materias}
                value={ln.materiaId}
                onChange={(id) => onChange(i, { materiaId: id })}
                unidadValue={ln.unidad}
                onUnidadChange={(u) => onChange(i, { unidad: u })}
              />
            </div>

            <div className="col-span-4">
              <Input
                type="number"
                step="0.001"
                placeholder="Cantidad"
                value={ln.cantidad}
                onChange={(e) => onChange(i, { cantidad: e.target.value })}
              />
            </div>

            <div className="col-span-1 flex justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}