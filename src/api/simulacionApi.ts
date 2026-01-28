import api from "./axiosClient";
import type { VisualSimulationResponse } from "../types/visual-types";

export interface Material {
  id_materia: number;
  nombre: string;
  cantidad_total: number;
}

export interface Escenario {
  ranking: number;
  ranking_score: number;
  total_personal_usado: number;
  total_maquinas_usadas: number;
  detalle_asignacion: Record<string, { personal: number; maquinas: number; tiempo_base: number }>;
}

export interface ReporteArea {
  id_area: number;
  nombre_area: string;
  total_combinaciones: number; 
  escenarios: Escenario[];
}

export interface DetalleProceso {
  t: number;
  pers: number;
  maq: number;
  area: string;
  nombre_proceso?: string; 
  max_pers?: number; 
}

export interface SimulationResult {
  diagrama_id: number;
  tiempo_total: number;
  es_factible: boolean;
  lista_materiales_total: Material[];
  analisis_escenarios: ReporteArea[];
  id_producto_frontend?: number; 
  detalles_procesos: Record<string, DetalleProceso>;
}


export interface SimulationPayload {
  productos: { id_catalogo: number; cantidad: number }[];
  asignacion_manual?: Record<string, number>;
  solo_info?: boolean; 
}

export interface SimulationPayload {
  productos: { id_catalogo: number; cantidad: number }[];
  asignacion_manual?: Record<string, number>;
  solo_info?: boolean;
  
  // Nuevo campo para controlar la optimización desde el front
  // 0.20 = 20% (Default)
  umbral_pausa?: number; 
}

// --- FUNCIONES API ---

// Simulación General (Costos/Personal)
export const runSimulation = async (payload: SimulationPayload) => {
  const response = await api.post<SimulationResult[]>("/simulacion/run", payload);
  return response.data;
};

// NUEVA: Simulación Visual / Optimización de Buffers (Angelo)
export const runVisualSimulation = async (payload: SimulationPayload) => {
  // Nota: El endpoint es /visual-run según configuramos en el backend
  const response = await api.post<VisualSimulationResponse>("/simulacion/visual-run", payload,
    { 
      timeout: 120000 // 120,000 ms = 2 Minutos. Suficiente para la optimización.
    }
  );
  return response.data;
};