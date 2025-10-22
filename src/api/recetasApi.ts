import axiosClient from "./axiosClient";

export const getRecetas = async () => {
  const res = await axiosClient.get("/recetas/");
  return res.data;
};

export const createReceta = async (data: any) => {
  const res = await axiosClient.post("/recetas/", data);
  return res.data;
};