// src/pages/Catalogo/ViewCatalogo.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createCatalogo,
  getCatalogos,
  updateCatalogo,
  deleteCatalogo,
} from "@/api/catalogoApi";

export default function ViewCatalogo() {
  const [catalogos, setCatalogos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    genero: "MIXTO",
    restriccion: "DEPORTIVO",
    precio: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
  try {
    const data = await getCatalogos();
    const sorted = data.sort((a: any, b: any) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );
    setCatalogos(sorted);
  } catch (error) {
    console.error("Error cargando catálogo:", error);
  }
};

  const handleSubmit = async () => {
    try {
      if (isEditing && currentItem) {
        await updateCatalogo(currentItem.id_catalogo, form);
      } else {
        await createCatalogo(form);
      }
      setIsDialogOpen(false);
      setIsEditing(false);
      setForm({
        nombre: "",
        descripcion: "",
        genero: "MIXTO",
        restriccion: "DEPORTIVO",
        precio: "",
      });
      fetchCatalogos();
    } catch (error) {
      console.error("Error guardando catálogo:", error);
    }
  };

  const handleEdit = (item: any) => {
    setIsEditing(true);
    setCurrentItem(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      genero: item.genero || "MIXTO",
      restriccion: item.restriccion || "DEPORTIVO",
      precio: item.precio || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCatalogo(id);
      fetchCatalogos();
    } catch (error) {
      console.error("Error eliminando catálogo:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h2 className="text-xl font-bold text-blue-700">Catálogo de Productos</h2>
        </div>

        <Button
          onClick={() => {
            setIsDialogOpen(true);
            setIsEditing(false);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo producto
        </Button>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Restricción</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                  No hay productos registrados.
                </TableCell>
              </TableRow>
            ) : (
              catalogos.map((c) => (
                <TableRow key={c.id_catalogo}>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.descripcion}</TableCell>
                  <TableCell>{c.genero}</TableCell>
                  <TableCell>{c.restriccion}</TableCell>
                  <TableCell>${c.precio}</TableCell>
                  <TableCell className="flex justify-center space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(c)}>
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(c.id_catalogo)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Crear/Editar */}
      {/* Dialog Crear/Editar */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {isEditing ? "Editar producto" : "Nuevo producto"}
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nombre</label>
        <Input
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <Input
          placeholder="Descripción del producto"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Género</label>
        <Select
          value={form.genero}
          onValueChange={(value) => setForm({ ...form, genero: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MIXTO">Mixto</SelectItem>
            <SelectItem value="HOMBRE">Hombre</SelectItem>
            <SelectItem value="MUJER">Mujer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Restricción</label>
        <Select
          value={form.restriccion}
          onValueChange={(value) => setForm({ ...form, restriccion: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione restricción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEPORTIVO">Deportivo</SelectItem>
            <SelectItem value="ESCOLAR">Escolar</SelectItem>
            <SelectItem value="PLANTILLA">Plantilla</SelectItem>
            <SelectItem value="CASUAL">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Precio ($)</label>
        <Input
          placeholder="Precio"
          type="number"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>
        {isEditing ? "Guardar cambios" : "Crear"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}