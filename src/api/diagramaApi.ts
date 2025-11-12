// src/api/diagramaApi.ts
import axiosClient from "./axiosClient";

export type Diagrama = {
  id_diagrama: number;
  nombre: string;
  id_catalogo: number;
  descripcion?: string | null;
  es_principal?: boolean;
};

function normalizeList(data: any): Diagrama[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.diagramas)) return data.diagramas;
  if (Array.isArray(data?.data?.diagramas)) return data.data.diagramas;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}


export const getDiagramas = async () => {
  const { data } = await axiosClient.get("/diagramas/");
  return data;
};

export const createDiagrama = async (payload: any) => {
  const { data } = await axiosClient.post("/diagramas/", payload);
  // algunos backends devuelven { data: diagrama }, otros el objeto directo
  return (data && data.data) ? data.data : data;
};

export const getDiagramasDetalle = async (idCatalogo: number) => {
  const { data } = await axiosClient.get(`/diagramas-detalle/${idCatalogo}`);
  return data;
};

export const getDiagramasPorCatalogo = async (idCatalogo: number) => {
  const { data } = await axiosClient.get(`/diagramas/${idCatalogo}`);
  // normaliza a un array de diagramas
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.diagramas)) return data.diagramas;
  if (Array.isArray(data?.data?.diagramas)) return data.data.diagramas;
  return [];
};


export async function getDiagramasByCatalogo(idCatalogo: number): Promise<Diagrama[]> {
  // 1) query param
  try {
    const { data } = await axiosClient.get("/diagramas", { params: { catalogo_id: idCatalogo } });
    const list = normalizeList(data);
    if (list.length) return list;
  } catch {}

  // 2) path param (fallback)
  try {
    const { data } = await axiosClient.get(`/diagramas/${idCatalogo}`);
    return normalizeList(data);
  } catch {
    return [];
  }
}