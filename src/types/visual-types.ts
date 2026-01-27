export interface VisualNodeState {
  cola: number;
  ocupado: boolean;
  nombre: string;
}

export interface ProcessTableRow {
  id_proceso: number;
  nombre: string;
  maquinas_count: number;
  personal_count: number;
  meta: number;
  progreso: number; // <--- NUEVO CAMPO
  activo: boolean; 
  estado: "TRABAJANDO" | "ESPERANDO" | "BLOQUEADO" | "FINALIZADO"; // Agregué FINALIZADO
  tiempo_activo: number;
  tiempo_pausado: number;
}

export interface ResourceRow {
  area: string;
  recurso: string; 
  cantidad: number;
}

export interface PersonalRow {
  area: string;
  personal_total: number;
  personal_ocupado: number;
}

export interface SimulationFrame {
  tiempo: number;
  buffer_stock: number;
  cuello_botella: { id: number; nombre: string; cantidad_cola: number } | null;
  nodos: Record<string, VisualNodeState>;
  
  tabla_procesos: ProcessTableRow[];
  tabla_bodega: ResourceRow[];
  tabla_maquinaria: ResourceRow[];
  tabla_personal: PersonalRow[];
}

// Estructura para la Gráfica
export interface ChartDataPoint {
  nombre: string;
  ideal_activo: number;
  ideal_pausado: number;
  real_activo: number;
  real_pausado: number;
}

export interface VisualSimulationResponse {
  modelo: string;
  meta_cantidad: number;
  resumen: {
    tiempo_total: number;
    items_producidos: number;
  };
  timeline: SimulationFrame[];
  grafica: ChartDataPoint[]; // <--- NUEVO CAMPO
  grafica_base64?: string;
}