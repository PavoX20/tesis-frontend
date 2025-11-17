import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCatalogos } from "@/api/catalogoApi";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SimulationProductCard } from "./SimulationProductCard";

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

export default function Simulacion() {
  const [selectedProducts, setSelectedProducts] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("simulacion:selectedProducts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [unitsByProduct, setUnitsByProduct] = useState<Record<number, number>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const stored = localStorage.getItem("simulacion:unitsByProduct");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
  );

  const [products, setProducts] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedProducts([]);

  // Persistimos selección de productos
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "simulacion:selectedProducts",
        JSON.stringify(selectedProducts)
      );
    } catch {
      /* ignore */
    }
  }, [selectedProducts]);

  // Persistimos # a simular por producto
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "simulacion:unitsByProduct",
        JSON.stringify(unitsByProduct)
      );
    } catch {
      /* ignore */
    }
  }, [unitsByProduct]);

  return (
    <div className="flex gap-6">
      {/* Sidebar de productos */}
      <aside className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Productos</h2>

        {/* Botón para editar productos */}
        <Button
          variant="secondary"
          className="w-full mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200"
          onClick={() => navigate("/catalogo")}
        >
          Editar productos
        </Button>

        {/* Acciones de selección */}
        <div className="flex justify-between mb-3 text-xs text-gray-500">
          <span>
            Seleccionados:{" "}
            <span className="font-semibold">{selectedProducts.length}</span>
          </span>
          {selectedProducts.length > 0 && (
            <button
              type="button"
              className="underline hover:text-blue-600"
              onClick={clearSelection}
            >
              Limpiar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" />
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 italic">No se encontraron productos.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => {
              const isSelected = selectedProducts.includes(p.id_catalogo);
              return (
                <li key={p.id_catalogo}>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => toggleProduct(p.id_catalogo)}
                  >
                    {capitalize(p.nombre)}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Panel principal de simulación */}
      <div className="flex-1 min-w-0 bg-blue-50 rounded-xl border border-blue-100 shadow-inner relative">
        {selectedProducts.length === 0 ? (
          <div className="min-h-[550px] flex items-center justify-center text-gray-500 italic text-center px-8">
            Selecciona uno o varios productos del panel izquierdo para
            configurar la simulación.
          </div>
        ) : (
          <div className="min-h-[550px] w-full p-4 overflow-x-auto overflow-y-hidden">
            {/* fila de cards con scroll horizontal */}
            <div className="flex flex-nowrap gap-4 w-max pr-4">
              {selectedProducts.map((id) => {
                const product = products.find((p) => p.id_catalogo === id);
                if (!product) return null;
                return (
                  <SimulationProductCard
                    key={product.id_catalogo}
                    product={product}
                    units={unitsByProduct[product.id_catalogo] ?? 1}
                    onUnitsChange={(value) =>
                      setUnitsByProduct((prev) => ({
                        ...prev,
                        [product.id_catalogo]: value,
                      }))
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
