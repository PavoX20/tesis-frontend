import axiosClient from "./axiosClient";

export const getDiagramas = async () => {
  const res = await axiosClient.get("/diagramas/");
  return res.data;
};

export const createDiagrama = async (data: any) => {
  const res = await axiosClient.post("/diagramas/", data);
  return res.data;
};

export const getDiagramasDetalle = async (idCatalogo: number) => {
  const res = await axiosClient.get(`/diagramas-detalle/${idCatalogo}`);
  return res.data;
};