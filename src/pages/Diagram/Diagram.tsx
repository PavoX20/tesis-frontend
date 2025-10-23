import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas/DiagramCanvas";
import { getCatalogos } from "@/api/catalogoApi";
import { Loader2 } from "lucide-react";

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

export default function Diagrama() {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [products, setProducts] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(false);

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        const data = await getCatalogos();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogos();
  }, []);

  return (
    <div className="flex gap-6">
      {/* Sidebar de productos */}
      <aside className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Productos</h2>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" />
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 italic">No se encontraron productos.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id_catalogo}>
                <Button
                  variant={
                    selectedProduct === p.id_catalogo ? "default" : "outline"
                  }
                  className="w-full justify-start"
                  onClick={() => setSelectedProduct(p.id_catalogo)}
                >
                  {capitalize(p.nombre)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Canvas del producto */}
      <div className="flex-1 bg-blue-50 rounded-xl border border-blue-100 shadow-inner p-6 relative">
        {!selectedProduct ? (
          <div className="h-[550px] flex items-center justify-center text-gray-500 italic">
            Selecciona un producto del panel izquierdo
          </div>
        ) : (
          <DiagramCanvas productId={selectedProduct} />
        )}
      </div>
    </div>
  );
}
