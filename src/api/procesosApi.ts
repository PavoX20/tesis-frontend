// src/api/procesosApi.ts
import axiosClient from "./axiosClient";

export type ProcesoUpdate = Partial<{
  nombre_proceso: string;
  distribucion: string | null;
  parametros: string | null;
  id_tipomaquina: number | null;
  orden: number | null;
  id_diagrama: number | null;
}>;

export type ProcesoLookupRow = {
  id_proceso: number;
  nombre_proceso: string;
  orden: number | null;
  id_diagrama: number | null;
  tipo: string | null;
  diagrama_nombre: string | null;
  catalogo_id: number | null;
  catalogo_nombre: string | null;
};

export const getProcesos = async () => {
  const res = await axiosClient.get("/procesos/");
  return res.data;
};

export const getProcesoById = async (id: number) => {
  const res = await axiosClient.get(`/procesos/${id}`);
  return res.data;
};

export const createProceso = async (data: any) => {
  const res = await axiosClient.post("/procesos/", data);
  return res.data;
};

export async function updateProceso(id: number, payload: ProcesoUpdate) {
  const { data } = await axiosClient.put(`/procesos/${id}`, payload);
  return data;
}

export const deleteProceso = async (id: number) => {
  const res = await axiosClient.delete(`/procesos/${id}`);
  return res.data;
};

export const getProcesoDetalle = async (id: number) => {
  const res = await axiosClient.get(`/procesos-detalle/${id}`);
  return res.data;
};

export const getProcesosPorDiagrama = async (idDiagrama: number) => {
  const res = await axiosClient.get(`/procesos/${idDiagrama}`);
  return res.data;
};

export async function updateProcesoTipo(
  id: number,
  payload: { tipo: "NORMAL" | "ALMACENAMIENTO" }
) {
  const res = await axiosClient.patch(`/procesos/${id}/tipo`, payload);
  return res.data;
}

/* ---------------------------
   🔧 Normalizador robusto
---------------------------- */
// Normalizador “defensivo” por si el backend envía {data} o {rows} u otro envoltorio:
function unwrapLookupPayload(payload: unknown): ProcesoLookupRow[] {
  const p = payload as any;
  const arr =
    (Array.isArray(p) && p) ||
    p?.data ||
    p?.rows ||
    p?.items ||
    p?.result ||
    p?.procesos ||
    [];
  return (arr ?? []) as ProcesoLookupRow[];
}

export async function getProcesosLookup(params?: {
  q?: string;
  diagrama_id?: number;
  catalogo_id?: number;
  limit?: number;
  skip?: number;
}): Promise<ProcesoLookupRow[]> {
  const { data } = await axiosClient.get("/procesos/lookup", { params });
  return unwrapLookupPayload(data);
}