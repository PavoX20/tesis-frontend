// src/api/datosProcesoApi.ts
import axiosClient from "./axiosClient";

export type DatoProceso = {
  id_medicion: number;
  id_proceso: number;
  cantidad: number | null;
  fecha: string;              // "YYYY-MM-DD"
  tiempo_total_min: number | null;
  tiempo_total_seg: number | null;
  operario: string | null;
  notas: string | null;
  id_catalogo: number | null;           // <-- NUEVO
};

export async function listDatosProceso(
  procesoId: number,
  limit = 1000
): Promise<DatoProceso[]> {
  const { data } = await axiosClient.get("/datos-proceso", {
    params: { proceso_id: procesoId, limit },
  });
  // Soporta [] o {items: []}
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  // Normaliza a que siempre exista id_catalogo (aunque sea null)
  return arr.map((r: any) => ({
    id_medicion: Number(r.id_medicion),
    id_proceso: Number(r.id_proceso),
    cantidad: r.cantidad ?? null,
    fecha: String(r.fecha),
    tiempo_total_min: r.tiempo_total_min ?? null,
    tiempo_total_seg: r.tiempo_total_seg ?? null,
    operario: r.operario ?? null,
    notas: r.notas ?? null,
    id_catalogo: r.id_catalogo ?? r.catalogo_id ?? null, // <-- NUEVO
  }));
}