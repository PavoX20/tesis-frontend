import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, Play, Box, Package } from "lucide-react";

export interface CatalogoSimple {
  id_catalogo: number;
  nombre: string;
}

interface ConfigPanelProps {
  catalogos: CatalogoSimple[];
  selectedProduct: string;
  setSelectedProduct: (val: string) => void;
  quantity: number;
  setQuantity: (val: number) => void;
  onStart: () => void;
}

export function ConfigPanel({ 
  catalogos, 
  selectedProduct, 
  setSelectedProduct, 
  setQuantity, 
  onStart 
}: ConfigPanelProps) {

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />

      {}
      <Card className="w-full max-w-md shadow-2xl border-white/50 bg-white/90 backdrop-blur-xl animate-in zoom-in-95 duration-500 relative z-10">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto bg-blue-100 p-3 rounded-2xl w-fit mb-3 text-blue-600 shadow-sm">
            <Settings2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">Nueva Simulación</CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Configura el modelo y la meta de producción.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-8 py-4">

          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-blue-500" /> Modelo
            </Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="h-12 border-slate-200 bg-slate-50/50 hover:bg-white rounded-xl transition-colors focus:ring-2 focus:ring-blue-100 text-base">
                <SelectValue placeholder="Seleccionar zapato..." />
              </SelectTrigger>
              <SelectContent>
                {catalogos.map((cat) => (
                  <SelectItem key={cat.id_catalogo} value={cat.id_catalogo.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-blue-500" /> Cantidad Meta
            </Label>
            <Input 
              type="number" 
              value={10} 
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="h-12 font-mono text-lg border-slate-200 bg-slate-50/50 hover:bg-white rounded-xl transition-colors focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </CardContent>
        <CardFooter className="pb-8 px-8 pt-2">
          <Button 
            className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50 rounded-lg transition-all hover:scale-[1.02]"
            onClick={onStart}
          >
            <Play className="w-4 h-4 mr-2 fill-white" />
            Iniciar Optimización
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}