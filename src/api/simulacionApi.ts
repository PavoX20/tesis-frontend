import axiosClient from "./axiosClient";
import type { VisualSimulationResponse, OptimizationResponse } from "../types/visual-types";

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

export const runSimulation = async (payload: SimulationPayload) => {
  const { data } = await axiosClient.post<SimulationResult[]>("/simulacion/run", payload);
  return data;
};

export const runVisualSimulation = async (payload: SimulationPayload) => {

  const requestBody = {
    shoe_id: payload.productos[0].id_catalogo,
    goal: payload.productos[0].cantidad
  };

  try {

    const { data } = await axiosClient.post<VisualSimulationResponse>(
      "/simulacion/visual-run", 
      requestBody,
      { timeout: 120000 } 

    );
    return data;

  } catch (error) {
    console.error("❌ Error conectando a /simulacion/visual-run:", error);
    throw error;
  }
};

export const runOptimizationAnalysis = async (payload: SimulationPayload) => {
  const requestBody = {
    shoe_id: payload.productos[0].id_catalogo,
    goal: payload.productos[0].cantidad
  };

  try {
    const { data } = await axiosClient.post<OptimizationResponse>(
      "/simulacion/optimize", 
      requestBody,
      { timeout: 300000 } 

    );
    return data;
  } catch (error) {
    console.error("❌ Error en optimize:", error);
    throw error;
  }
};

