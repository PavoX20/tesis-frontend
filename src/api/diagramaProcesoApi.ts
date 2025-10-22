import axiosClient from "./axiosClient";

export const getRelaciones = async () => {
  const res = await axiosClient.get("/diagrama-proceso/");
  return res.data;
};

export const createRelacion = async (data: any) => {
  const res = await axiosClient.post("/diagrama-proceso/", data);
  return res.data;
};