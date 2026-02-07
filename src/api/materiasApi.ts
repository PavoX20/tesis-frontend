import axios from "axios";

export type Materia = {
  id_materia: number;
  nombre: string;
  unidad: "KG" | "M2" | "PAR" | "UNIDAD";
  costo: number;
  tipo: "materia_prima" | "materia_procesada" | "otro";
};

const API = "/materias";

export async function listMaterias(q?: string, limit = 50, skip = 0): Promise<Materia[]> {
  const res = await axios.get(API, { params: { q, limit, skip } });

  return Array.isArray(res.data) ? res.data : [];
}

export async function createMateria(payload: Omit<Materia, "id_materia">): Promise<Materia> {
  const res = await axios.post(API, payload);
  return res.data; 
}