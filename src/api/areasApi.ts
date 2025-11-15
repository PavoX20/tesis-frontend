import axiosClient from "./axiosClient";

export const getAreas = async () => {
  const res = await axiosClient.get("/areas/");
  return res.data;
};

export const getAreaById = async (id: number) => {
  const res = await axiosClient.get(`/areas/${id}`);
  return res.data;
};

export const createArea = async (data: any) => {
  const res = await axiosClient.post("/areas/", data);
  return res.data;
};

export const updateArea = async (id: number, data: any) => {
  const res = await axiosClient.put(`/areas/${id}`, data);
  return res.data;
};

export const deleteArea = async (id: number) => {
  const res = await axiosClient.delete(`/areas/${id}`);
  return res.data;
};