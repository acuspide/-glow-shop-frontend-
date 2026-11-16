import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { ArticuloVentas } from '../modelos/modelos';

/** Endpoints de reportes. */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);

  /** GET /api/reportes/articulos-mas-vendidos: el ranking lo calcula el backend (JOIN, GROUP BY y SUM). */
  masVendidos(limite: number): Observable<ArticuloVentas[]> {
    const params = new HttpParams().set('limite', limite);
    return this.http.get<ArticuloVentas[]>(`${API_URL}/reportes/articulos-mas-vendidos`, { params });
  }
}
