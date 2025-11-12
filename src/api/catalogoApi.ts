// src/api/catalogoApi.ts
import axiosClient from "./axiosClient";

export type Catalogo = { id_catalogo: number; nombre: string };

export const getCatalogos = async (): Promise<Catalogo[]> => {
  const { data } = await axiosClient.get("/catalogo/");
  return Array.isArray(data) ? data : (Array.isArray(data?.catalogos) ? data.catalogos : []);
};

export const getCatalogoById = async (id: number): Promise<Catalogo> => {
  const { data } = await axiosClient.get(`/catalogo/${id}`);
  return data?.catalogo ?? data; // acepta ambas formas
};

export const createCatalogo = async (payload: Partial<Catalogo>) => {
  const { data } = await axiosClient.post("/catalogo/", payload);
  return data;
};

export const updateCatalogo = async (id: number, payload: Partial<Catalogo>) => {
  const { data } = await axiosClient.put(`/catalogo/${id}`, payload);
  return data;
};

export const deleteCatalogo = async (id: number) => {
  const { data } = await axiosClient.delete(`/catalogo/${id}`);
  return data;
};