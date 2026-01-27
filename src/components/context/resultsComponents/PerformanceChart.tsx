import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartData {
  nombre: string;
  ideal_activo: number;
  real_activo: number;
  real_pausado: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="h-full border-slate-200 shadow-sm bg-white flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Eficiencia: Ideal vs Real
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">Tiempos (min/s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barSize={12} // Barras finas y elegantes
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
            
            <XAxis type="number" fontSize={10} stroke="#94a3b8" />
            <YAxis 
                dataKey="nombre" 
                type="category" 
                width={100} 
                fontSize={9} 
                stroke="#64748b" 
                tick={{ fill: '#475569' }}
            />
            
            <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            
            {/* Barras Apiladas: IDEAL */}
            <Bar dataKey="ideal_activo" name="Ideal (Teórico)" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            
            {/* Barras Apiladas: REAL */}
            <Bar dataKey="real_activo" name="Real (Trabajo)" stackId="b" fill="#22c55e" />
            <Bar dataKey="real_pausado" name="Real (Espera)" stackId="b" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}