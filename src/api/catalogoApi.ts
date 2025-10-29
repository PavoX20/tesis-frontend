import axiosClient from "./axiosClient";

export const getCatalogos = async () => {
  const res = await axiosClient.get("/catalogo/");
  // Ajustar al formato real del backend
  return res.data.catalogos || [];
};

export const getCatalogoById = async (id: number) => {
  const res = await axiosClient.get(`/catalogo/${id}`);
  return res.data.catalogo; // también consistente con el patrón
};

export const createCatalogo = async (data: any) => {
  const res = await axiosClient.post("/catalogo/", data);
  return res.data;
};

export const updateCatalogo = async (id: number, data: any) => {
  const res = await axiosClient.put(`/catalogo/${id}`, data);
  return res.data;
};

export const deleteCatalogo = async (id: number) => {
  const res = await axiosClient.delete(`/catalogo/${id}`);
  return res.data;
};