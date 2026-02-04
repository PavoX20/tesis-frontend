import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface PerformanceChartProps {
  chartBase64?: string;
  isVisible: boolean;
}

export function PerformanceChart({ chartBase64, isVisible }: PerformanceChartProps) {
  if (!isVisible || !chartBase64) return null;

  return (
    <Card className="border-slate-200 shadow-sm bg-white mt-6 overflow-hidden">
      <CardHeader className="py-3 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          Análisis de Ciclos
        </CardTitle>
        <Badge variant="outline" className="text-[10px] bg-white">Engine Output</Badge>
      </CardHeader>
      <CardContent className="p-4 flex justify-center bg-white">
        <img 
          src={`data:image/png;base64,${chartBase64}`} 
          alt="Gráfica de Simulación" 
          className="max-w-full h-auto rounded shadow-sm border border-slate-100"
        />
      </CardContent>
    </Card>
  );
}