import axiosClient from "./axiosClient";


export type ProcesoUpdate = Partial<{
  nombre_proceso: string;
  distribucion: string | null;
  parametros: string | null;
  id_tipomaquina: number | null;
  orden: number | null;
}>;

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