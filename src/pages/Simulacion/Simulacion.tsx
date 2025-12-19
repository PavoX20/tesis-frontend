import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCatalogos } from "@/api/catalogoApi";
import { runSimulation, type SimulationResult } from "@/api/simulacionApi"; 
import { Loader2, PlayCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SimulationProductCard } from "./SimulationProductCard";
import { Toaster, toast } from "sonner"; // Usamos 'toast' directamente

interface Catalogo {
  id_catalogo: number;
  nombre: string;
}

export default function Simulacion() {
  // --- ESTADOS ---
  const [selectedProducts, setSelectedProducts] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem("simulacion:selectedProducts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [unitsByProduct, setUnitsByProduct] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem("simulacion:unitsByProduct");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [products, setProducts] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<Record<number, SimulationResult>>({});

  const navigate = useNavigate();

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // --- EFECTOS ---
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        const data = await getCatalogos();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        toast.error("Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogos();
  }, []);

  // Persistencia
  useEffect(() => {
    localStorage.setItem("simulacion:selectedProducts", JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  useEffect(() => {
    localStorage.setItem("simulacion:unitsByProduct", JSON.stringify(unitsByProduct));
  }, [unitsByProduct]);

  // --- HANDLERS ---
  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setSimulationResults({});
  };

  const handleRunSimulation = async () => {
    if (selectedProducts.length === 0) return;

    setSimulating(true);
    setSimulationResults({}); // Limpiar anteriores para efecto visual

    try {
      // 1. Preparar Payload
      // Mapeamos los IDs seleccionados a objetos { id, cantidad }
      // Importante: Guardamos este orden para mapear la respuesta después
      const payloadProducts = selectedProducts.map(id => ({
        id_catalogo: id,
        cantidad: unitsByProduct[id] || 1
      }));

      // 2. Llamada API
      const resultsArray = await runSimulation({ productos: payloadProducts });

      // 3. Mapear respuesta (Array -> Objeto por ID)
      const newResultsMap: Record<number, SimulationResult> = {};

      resultsArray.forEach((res, index) => {
        // Asumimos que el backend devuelve en el mismo orden (FIFO)
        const originalRequest = payloadProducts[index];
        if (originalRequest) {
          newResultsMap[originalRequest.id_catalogo] = res;
        }
      });

      setSimulationResults(newResultsMap);
      toast.success("Simulación completada con éxito");

    } catch (error) {
      console.error("Error simulando:", error);
      toast.error("Ocurrió un error al simular. Revisa la consola.");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Componente Toaster necesario para ver las notificaciones */}
      <Toaster richColors position="top-right" />

      {/* Sidebar */}
      <aside className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Simulador</h2>
        
        <Button
          variant="secondary"
          className="w-full mb-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs h-8"
          onClick={() => navigate("/catalogo")}
        >
          Administrar Catálogo
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1 custom-scrollbar">
           {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                <Loader2 className="animate-spin mb-2 w-5 h-5" /> Cargando...
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No hay productos.</p>
            ) : (
              products.map((p) => {
                const isSelected = selectedProducts.includes(p.id_catalogo);
                return (
                  <Button
                    key={p.id_catalogo}
                    variant={isSelected ? "default" : "ghost"}
                    className={`w-full justify-start text-xs h-8 px-2 truncate ${
                      isSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleProduct(p.id_catalogo)}
                  >
                    {capitalize(p.nombre)}
                  </Button>
                );
              })
            )}
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-500">
             <span>{selectedProducts.length} seleccionados</span>
             {selectedProducts.length > 0 && (
               <button onClick={clearSelection} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                 <Trash2 className="w-3 h-3" /> Limpiar
               </button>
             )}
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-sm transition-all active:scale-95"
            onClick={handleRunSimulation}
            disabled={selectedProducts.length === 0 || simulating}
          >
            {simulating ? (
              <> <Loader2 className="animate-spin mr-2 w-4 h-4" /> Calculando... </>
            ) : (
              <> <PlayCircle className="mr-2 w-4 h-4" /> Ejecutar Simulación </>
            )}
          </Button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 min-w-0 bg-slate-50 rounded-xl border border-slate-200 shadow-inner relative overflow-hidden">
        {selectedProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 px-8">
            <PlayCircle className="w-12 h-12 mb-4 opacity-20" />
            <p>Selecciona productos del menú izquierdo para comenzar.</p>
          </div>
        ) : (
          <div className="h-full w-full p-6 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex flex-nowrap gap-6 w-max pr-10 h-full items-start pb-4">
              {selectedProducts.map((id) => {
                const product = products.find((p) => p.id_catalogo === id);
                if (!product) return null;
                return (
                  <SimulationProductCard
                    key={product.id_catalogo}
                    product={product}
                    units={unitsByProduct[product.id_catalogo] ?? 1}
                    onUnitsChange={(value) =>
                      setUnitsByProduct((prev) => ({ ...prev, [product.id_catalogo]: value }))
                    }
                    result={simulationResults[product.id_catalogo]}
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