import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Articulo, FiltrosBusqueda, Pagina } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class ArticuloService {
  private readonly http = inject(HttpClient);

  /** GET /api/articulos: todos los artículos disponibles (sin paginar). */
  listar(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${API_URL}/articulos`);
  }

  /** GET /api/buscarArticulos: busqueda con filtros opcionales y paginacion. */
  buscar(filtros: FiltrosBusqueda, pagina = 0, tamano = 12): Observable<Pagina<Articulo>> {
    let params = new HttpParams().set('page', pagina).set('size', tamano);

    // Solo enviamos los filtros que tienen valor.
    if (filtros.texto?.trim()) params = params.set('texto', filtros.texto.trim());
    if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId);
    if (filtros.tono) params = params.set('tono', filtros.tono);
    if (filtros.tipoPiel) params = params.set('tipoPiel', filtros.tipoPiel);

    return this.http.get<Pagina<Articulo>>(`${API_URL}/buscarArticulos`, { params });
  }
}

