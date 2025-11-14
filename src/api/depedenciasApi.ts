// src/api/dependenciasApi.ts
import axiosClient from "@/api/axiosClient";

/** Item breve para combos de procesos */
export type ProcesoLookupItem = {
  id_proceso: number;
  nombre_proceso: string;
  orden?: number | null;
  id_diagrama: number | null; 
  tipo?: "NORMAL" | "ALMACENAMIENTO";
  diagrama_nombre?: string | null;
  catalogo_id?: number | null;
};

export type DependenciasProceso = {
  predecesores: Array<{ id_proceso: number; nombre_proceso: string; orden: number | null; id_diagrama: number }>;
  sucesores: Array<{ id_proceso: number; nombre_proceso: string; orden: number | null; id_diagrama: number }>;
};

/** GET /dependencias/procesos/{id_proceso} */
export async function getDependenciasPorProceso(id_proceso: number): Promise<DependenciasProceso> {
  const { data } = await axiosClient.get(`/dependencias/procesos/${id_proceso}`);
  return data;
}

/** GET /procesos/lookup */
export type LookupProcesosParams = {
  q?: string;
  diagrama_id?: number;
  catalogo_id?: number;
  exclude_id?: number;
  tipo?: "NORMAL" | "ALMACENAMIENTO";
  skip?: number;
  limit?: number;
};

export async function lookupProcesos(params: LookupProcesosParams = {}): Promise<ProcesoLookupItem[]> {
  const { data } = await axiosClient.get(`/procesos/lookup`, { params });
  return Array.isArray(data) ? data : [];
}

// src/api/dependenciasApi.ts
export async function putPredecesores(
  id_proceso: number,
  predecesoresIds: number[],
  exigirMismoDiagrama: boolean
): Promise<void> {
  await axiosClient.put(
    `/dependencias/procesos/${id_proceso}`,
    { predecesores: predecesoresIds },
    { params: { exigir_mismo_diagrama: exigirMismoDiagrama } }
  );
}