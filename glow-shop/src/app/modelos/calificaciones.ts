// Espejos de los DTOs de calificaciones del backend.

// Espejo de CalificarArticuloRequest
export interface CalificarArticuloRequest {
  puntuacion: number; // de 1 a 5 estrellas
  comentario: string;
}

// Espejo de CalificacionResponse
export interface Calificacion {
  id: string;
  articuloId: string;
  clienteId: string;
  puntuacion: number;
  comentario: string;
  fecha: string;
}

// Espejo de CalificacionesArticuloResponse
export interface CalificacionesArticulo {
  articuloId: string;
  promedio: number;
  total: number;
  calificaciones: Calificacion[];
}
