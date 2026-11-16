import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Calificacion, CalificacionesArticulo, CalificarArticuloRequest } from '../modelos/calificaciones';

/** Endpoints de calificaciones (reseñas con estrellas). */
@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private readonly http = inject(HttpClient);

  /** GET /api/articulos/{id}/calificaciones: promedio, total y lista (público). */
  deArticulo(articuloId: string): Observable<CalificacionesArticulo> {
    return this.http.get<CalificacionesArticulo>(`${API_URL}/articulos/${articuloId}/calificaciones`);
  }

  /** POST /api/articulos/{id}/calificaciones: solo una clienta que ya recibió el artículo. */
  calificar(articuloId: string, solicitud: CalificarArticuloRequest): Observable<Calificacion> {
    return this.http.post<Calificacion>(`${API_URL}/articulos/${articuloId}/calificaciones`, solicitud);
  }
}
