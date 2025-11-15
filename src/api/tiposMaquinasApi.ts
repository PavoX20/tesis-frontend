import axiosClient from "./axiosClient";

export const getTiposMaquinas = async () => {
  const res = await axiosClient.get("/tipos-maquinas/");
  return res.data;
};

export const createTipoMaquina = async (data: any) => {
  const res = await axiosClient.post("/tipos-maquinas/", data);
  return res.data;
};