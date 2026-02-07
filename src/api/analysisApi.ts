// src/api/analysisApi.ts
import api from "./axiosClient"; 

export interface RankedItem {
  titulo: string;
  ks: number | null;
  p: number | null;
  r2: number | null;
  distrib: string;
  parametros: number[];
}

export interface AutoResponse {
  modo: "auto" | "manual";
  seleccion: string | null;
  parametros: number[];
  mensaje: string;
  ranking: RankedItem[];
  image_base64: string | null;
}

export interface ManualResponse {
  modo: "manual";
  seleccion: string;
  parametros: number[];
  mensaje: string;
  image_base64: string | null;
}

export async function getAutoDistribution(
  procesoId: number,
  umbral = 20
): Promise<AutoResponse> {
  const res = await api.get<AutoResponse>(
    `/analysis/processes/${procesoId}/distribution`,
    { params: { umbral } }
  );
  return res.data;
}

export async function getDistributionParamNames(
  nombre: string
): Promise<string[]> {
  const res = await api.get<string[]>(`/analysis/distributions/${nombre}/params`);
  return res.data;
}

export async function postManualDistribution(
  procesoId: number,
  body: { nombre: string; parametros: number[]; umbral?: number }
): Promise<ManualResponse> {
  const res = await api.post<ManualResponse>(
    `/analysis/processes/${procesoId}/distribution/manual`,
    body
  );
  return res.data;
}