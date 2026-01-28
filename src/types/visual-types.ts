// Estructura de un "Frame" o instante en la película
export interface ProcessState {
  estado: string;          // Ej: "ACTIVO", "PAUSADO S/MP", "FINALIZADO"
  buffer_actual: number;   // El valor del buffer en ese momento
  producido: string;       // Ej: "10/50"
}

export interface AnimationFrame {
  timestamp: number;       // Segundo exacto de la simulación (0.1, 0.2...)
  procesos: Record<string, ProcessState>; // Diccionario { "100": { ... }, "101": { ... } }
}

// Detalles finales calculados por la optimización
export interface ProcessDetail {
  buffer_recomendado: number; // EL DATO MÁS IMPORTANTE
  estado_final: string;
  t_activo: string;           // "HH:MM:SS.mmm"
  t_pausado: string;
  ratio_pausa?: number;
}

// La respuesta completa que viene del endpoint /visual-run
export interface VisualSimulationResponse {
  modelo: string;
  meta_cantidad: number;
  
  resumen: {
    tiempo_calculo: string;
    status: string;
    umbral_usado?: string;
  };

  // Aquí están los buffers óptimos (para mostrar en tabla de resultados)
  detalles_procesos: Record<string, ProcessDetail>;

  // Aquí está la película (para el reproductor/timeline)
  historial_animacion: AnimationFrame[];

  // La imagen generada en Python (Base64)
  grafica_base64?: string;
}