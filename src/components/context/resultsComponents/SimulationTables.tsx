import type { ProcessTableRow, ResourceRow, PersonalRow } from "@/types/visual-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SimulationTablesProps {
  processData: ProcessTableRow[];
  bodegaData: ResourceRow[];
  maquinariaData: ResourceRow[];
  personalData: PersonalRow[];
}

export function SimulationTables({ processData, maquinariaData, personalData }: SimulationTablesProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. TABLA PRINCIPAL DE PROCESOS (Ocupa 3 columnas) */}
      <Card className="xl:col-span-3 border-slate-200 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="py-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide">
             Monitor de Procesos en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[50px] text-xs font-bold text-slate-500">ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Proceso</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500">Maq.</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500">Pers.</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500">Meta</TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-500">Estado</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">T. Activo</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500">T. Pausado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processData.map((row) => (
                <TableRow key={row.id_proceso} className="hover:bg-blue-50/50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{row.id_proceso}</TableCell>
                  <TableCell className="font-medium text-xs text-slate-700">{row.nombre}</TableCell>
                  <TableCell className="text-center text-xs">{row.maquinas_count}</TableCell>
                  <TableCell className="text-center text-xs">{row.personal_count}</TableCell>
                  <TableCell className="text-center text-xs text-slate-500">{row.meta}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                        variant="outline" 
                        className={`text-[10px] h-5 ${
                            row.estado === "TRABAJANDO" ? "bg-green-50 text-green-700 border-green-200" :
                            row.estado === "EN COLA" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                    >
                        {row.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-600">{row.tiempo_activo.toFixed(1)}s</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-400">{row.tiempo_pausado.toFixed(1)}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 2. TABLAS DE RECURSOS (Columna Derecha) */}
      <div className="flex flex-col gap-4">
        
        {/* Tabla Bodega (COMENTADA PARA OCULTAR) */}
        {/*
        <Card className="border-slate-200 shadow-sm bg-white/80">
            <CardHeader className="py-2 border-b border-slate-100">
                 <CardTitle className="text-xs font-bold text-slate-600 uppercase">Inventario (Bodega)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[120px]">
                <Table>
                    <TableBody>
                        {bodegaData.map((r, i) => (
                            <TableRow key={i} className="h-8">
                                <TableCell className="text-[10px] py-1">{r.area}</TableCell>
                                <TableCell className="text-[10px] py-1 text-slate-500">{r.recurso}</TableCell>
                                <TableCell className="text-[10px] py-1 font-bold text-right">{r.cantidad}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        */}

        {/* Tabla Maquinaria */}
        <Card className="border-slate-200 shadow-sm bg-white/80">
            <CardHeader className="py-2 border-b border-slate-100">
                 <CardTitle className="text-xs font-bold text-slate-600 uppercase">Maquinaria</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[120px]">
                <Table>
                    <TableBody>
                        {maquinariaData.map((r, i) => (
                            <TableRow key={i} className="h-8">
                                <TableCell className="text-[10px] py-1">{r.area}</TableCell>
                                <TableCell className="text-[10px] py-1 text-slate-500">{r.recurso}</TableCell>
                                <TableCell className="text-[10px] py-1 font-bold text-right">{r.cantidad}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Tabla Personal */}
        <Card className="border-slate-200 shadow-sm bg-white/80">
            <CardHeader className="py-2 border-b border-slate-100">
                 <CardTitle className="text-xs font-bold text-slate-600 uppercase">Personal</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[120px]">
                <Table>
                    <TableBody>
                        {personalData.map((r, i) => (
                            <TableRow key={i} className="h-8">
                                <TableCell className="text-[10px] py-1">{r.area}</TableCell>
                                <TableCell className="text-[10px] py-1 text-right">
                                    <span className="font-bold text-blue-600">{r.personal_ocupado}</span>
                                    <span className="text-slate-400"> / {r.personal_total}</span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}