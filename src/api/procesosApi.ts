import axiosClient from "./axiosClient";

interface ProcesoPayload {
  nombre_proceso?: string;
  distribucion?: string;
  parametros?: string;
}

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

export const updateProceso = async (id: number, data: ProcesoPayload) => {
  const res = await axiosClient.put(`/procesos/${id}`, data);
  return res.data;
};

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