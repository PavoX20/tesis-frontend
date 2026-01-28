// src/api/datosProcesoApi.ts
import axiosClient from "./axiosClient";

export type DatoProceso = {
  id_medicion: number;
  id_proceso: number;
  cantidad: number | null;
  fecha: string;              
  tiempo_total_min: string | null;
  tiempo_total_seg: string | null;
  operario: string | null;
  notas: string | null;
  id_catalogo: number | null;
};




function mapDato(r: any): DatoProceso {
  return {
    id_medicion: Number(r.id_medicion),
    id_proceso: Number(r.id_proceso),
    cantidad: r.cantidad != null ? Number(r.cantidad) : null,
    fecha: String(r.fecha),

    tiempo_total_min:
      r.tiempo_total_min !== undefined && r.tiempo_total_min !== null
        ? String(r.tiempo_total_min)
        : null,
    tiempo_total_seg:
      r.tiempo_total_seg !== undefined && r.tiempo_total_seg !== null
        ? String(r.tiempo_total_seg)
        : null,
    operario: r.operario ?? null,
    notas: r.notas ?? null,
    id_catalogo: r.id_catalogo ?? r.catalogo_id ?? null,
  };
}

export async function listDatosProceso(
  procesoId: number,
  limit = 1000
): Promise<DatoProceso[]> {
  const { data } = await axiosClient.get("/datos-proceso", {
    params: { proceso_id: procesoId, limit },
  });

  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return arr.map(mapDato);
}


export async function createDatoProceso(input: {
  id_proceso: number;
  id_catalogo: number;
  cantidad: number | null;
  fecha: string; 
  tiempo_total_min: string | null;
  tiempo_total_seg: string | null;
  operario: string | null;
  notas: string | null;
}): Promise<DatoProceso> {
  const { data } = await axiosClient.post("/datos-proceso", {
    id_proceso: input.id_proceso,
    id_catalogo: input.id_catalogo,
    cantidad: input.cantidad,
    fecha: input.fecha,
    tiempo_total_min: input.tiempo_total_min,
    tiempo_total_seg: input.tiempo_total_seg,
    operario: input.operario,
    notas: input.notas,
  });

  return mapDato(data);
}