// Datos para la tabla y animación
export interface ProcessState {
  estado: string;
  buffer_actual: number;
  producido: string;
  nombre_maquina?: string;
  nombre_proceso?: string;
}

export interface AnimationFrame {
  timestamp: number;
  procesos: Record<string, ProcessState>; 
}

export interface ProcessDetail {
  buffer_recomendado: number;
  estado_final: string;
  t_activo?: string;
  t_pausado?: string;
  producido?: string;
  nombre_maquina?: string;
  nombre_proceso?: string;
  nombre?: string; // Legacy support
}

// Estructura de respuesta del Backend
export interface SimulationMetadata {
  shoe_id: number;
  goal: number;
  bottleneck_process_id?: number;
  total_time_seconds: number;
}

export interface SimulationResults {
  chart_base64?: string;
  // El backend puede enviar cualquiera de estos nombres
  history_main?: any[]; 
  historial_animacion?: any[]; 
  detalles_procesos?: Record<string, any>;
}

export interface VisualSimulationResponse {
  status: string;
  simulation_metadata: SimulationMetadata;
  results: SimulationResults;
  // Propiedad opcional para compatibilidad si el back la envía en raíz
  modelo?: string;
}

// Tipo para filas crudas del historial (Usado en SimulationDiagram)
export interface SimulationHistoryRow {
  ID_PROCESO: number;
  T_HIST: number;
  ESTADO: string;
  CANTIDAD: string | number;
  META: string | number;
  ID_MAQUINA?: string;
}