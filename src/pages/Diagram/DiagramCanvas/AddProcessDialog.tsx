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

interface AddProcessDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  newNodeName: string;
  setNewNodeName: (value: string) => void;
  insertPos: string;
  setInsertPos: (value: string) => void;
  handleAddNode: () => void;
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
  nodesLength,
}: AddProcessDialogProps) {
  const isDisabled =
    !newNodeName.trim() || !insertPos.trim() || Number(insertPos) < 1;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setInsertPos((nodesLength + 1).toString())}
        >
          +
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agregar nuevo proceso</AlertDialogTitle>
          <AlertDialogDescription>
            Inserta un nuevo proceso dentro del flujo de{" "}
            <span className="font-semibold text-blue-600">
              Producto #{productId}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nodeName" className="text-right">
              Nombre
            </Label>
            <Input
              id="nodeName"
              className="col-span-3"
              placeholder={`Proceso ${nodesLength + 1}`}
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
            />
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
                nodesLength === 0 ? "1" : `1 - ${nodesLength + 1}`
              }
              value={insertPos}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^[0-9]+$/.test(val)) setInsertPos(val);
              }}
              disabled={nodesLength === 0}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction disabled={isDisabled} onClick={handleAddNode}>
            Crear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}