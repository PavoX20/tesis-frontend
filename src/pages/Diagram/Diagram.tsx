import { useState } from "react"
import { Button } from "@/components/ui/button"
import DiagramCanvas from "@/pages/Diagram/DiagramCanvas"

export default function Diagrama() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  const products = [
    { id: "airflow", name: "Airflow" },
    { id: "nike", name: "Nike Air" },
    { id: "adidas", name: "Adidas Run" },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar de productos */}
      <aside className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-700">Productos</h2>
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id}>
              <Button
                variant={selectedProduct === p.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedProduct(p.id)}
              >
                {p.name}
              </Button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Canvas del producto */}
      <div className="flex-1 bg-blue-50 rounded-xl border border-blue-100 shadow-inner p-6 relative">
        {!selectedProduct ? (
          <div className="h-[550px] flex items-center justify-center text-gray-500 italic">
            Selecciona un producto del panel izquierdo
          </div>
        ) : (
          <DiagramCanvas productName={selectedProduct} />
        )}
      </div>
    </div>
  )
}