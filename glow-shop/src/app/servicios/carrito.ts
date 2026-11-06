import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Carrito, Pedido } from '../modelos/modelos';

/**
 * Estado del carrito compartido por toda la app (el contador del menu y la pagina del carrito).
 * El carrito vive en el backend: aqui­ solo guardamos la ultima copia que nos respondia.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);

  readonly carrito = signal<Carrito | null>(null);

  /** Total de unidades, para el numerito del menu. */
  readonly cantidadTotal = computed(
    () => this.carrito()?.items.reduce((suma, item) => suma + item.cantidad, 0) ?? 0,
  );

  /**
   * GET /api/carrito
   * Un cliente que todavia no ha agregado nada recibe 404 del backend: lo tratamos como carrito vaci­o.
   */
  cargar(): Observable<Carrito> {
    return this.http.get<Carrito>(`${API_URL}/carrito`).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 404 ? of<Carrito>({ id: '', clienteId: '', items: [], total: 0 }) : throwError(() => error),
      ),
      tap((c) => this.carrito.set(c)),
    );
  }

  /** POST /api/carrito/items */
  agregar(articuloId: string, cantidad = 1): Observable<Carrito> {
    return this.http
      .post<Carrito>(`${API_URL}/carrito/items`, { articuloId, cantidad })
      .pipe(tap((c) => this.carrito.set(c)));
  }

  /** PUT /api/carrito/items/{id}: responde 204, por eso volvemos a cargar el carrito. */
  cambiarCantidad(articuloId: string, cantidad: number): Observable<void> {
    return this.http.put<void>(`${API_URL}/carrito/items/${articuloId}`, { cantidad });
  }

  /** DELETE /api/carrito/items/{id} */
  quitar(articuloId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/carrito/items/${articuloId}`);
  }

  /** DELETE /api/carrito/items */
  vaciar(): Observable<void> {
    return this.http.delete<void>(`${API_URL}/carrito/items`);
  }

  /** POST /api/pedidos: crea un pedido por cada tienda que haya en el carrito. */
  confirmarPedido(): Observable<Pedido[]> {
    return this.http.post<Pedido[]>(`${API_URL}/pedidos`, {});
  }

  /** Se llama al cerrar sesion. */
  limpiar(): void {
    this.carrito.set(null);
  }
}
