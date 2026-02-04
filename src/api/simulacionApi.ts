import axiosClient from "./axiosClient";
import type { VisualSimulationResponse } from "../types/visual-types";

// ==========================================
// TIPOS LEGACY (Mantenidos para compatibilidad)
// ==========================================

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

// ==========================================
// TIPOS ACTUALES
// ==========================================

export interface SimulationPayload {
  productos: { id_catalogo: number; cantidad: number }[];
  asignacion_manual?: Record<string, number>;
  solo_info?: boolean;
}

// ==========================================
// FUNCIONES API
// ==========================================

// 1. Simulación General (Legacy - Tablas y Costos)
// Ruta: POST /simulacion/run
export const runSimulation = async (payload: SimulationPayload) => {
  const { data } = await axiosClient.post<SimulationResult[]>("/simulacion/run", payload);
  return data;
};

// 2. Simulación Visual (Angelo Engine - Animación)
// Ruta: POST /simulacion/visual-run
export const runVisualSimulation = async (payload: SimulationPayload) => {
  
  // Transformación de Datos (Frontend -> Backend)
  const requestBody = {
    shoe_id: payload.productos[0].id_catalogo,
    goal: payload.productos[0].cantidad
  };

  try {
    // CORRECCIÓN FINAL: Apuntamos a /simulacion/visual-run
    // Esto coincide con el router del backend: @router.post("/visual-run")
    // Asumiendo que el prefijo global en main.py es "/simulacion" (igual que la función de arriba).
    const { data } = await axiosClient.post<VisualSimulationResponse>(
      "/simulacion/visual-run", 
      requestBody,
      { timeout: 120000 } // 2 minutos para cálculos pesados
    );
    return data;

  } catch (error) {
    console.error("❌ Error conectando a /simulacion/visual-run:", error);
    throw error;
  }
};