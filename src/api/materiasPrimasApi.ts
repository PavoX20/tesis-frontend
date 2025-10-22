import axiosClient from "./axiosClient";

export const getMateriasPrimas = async () => {
  const res = await axiosClient.get("/materias-primas/");
  return res.data;
};

export const createMateriaPrima = async (data: any) => {
  const res = await axiosClient.post("/materias-primas/", data);
  return res.data;
};