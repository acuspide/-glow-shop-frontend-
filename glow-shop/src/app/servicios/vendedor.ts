import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Pedido } from '../modelos/modelos';
import {
  ArticuloPublicado,
  Categoria,
  EstadoPedido,
  Inventario,
  InventarioActualizado,
  Marca,
  PublicarArticuloRequest,
  RegistrarTiendaRequest,
  Tienda,
} from '../modelos/vendedor';

/**
 * Todo lo que usa el panel del vendedor. El token lo agrega el interceptor,
 * y el backend toma al vendedor de ese token: por eso ninguna ruta lleva su id.
 */
@Injectable({ providedIn: 'root' })
export class VendedorService {
  private readonly http = inject(HttpClient);

  // ---------- Pedidos ----------

  /** GET /api/vendedor/pedidos: los pedidos de la tienda del vendedor. */
  pedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${API_URL}/vendedor/pedidos`);
  }

  /** PUT /api/vendedor/pedidos/{id}/estado: avanza el pedido al siguiente estado. */
  cambiarEstado(pedidoId: string, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${API_URL}/vendedor/pedidos/${pedidoId}/estado`, { estado });
  }

  // ---------- Inventario ----------

  /** GET /api/inventario: el stock de los artículos de la tienda. */
  inventario(): Observable<Inventario> {
    return this.http.get<Inventario>(`${API_URL}/inventario`);
  }

  /** GET /api/inventario/stock-bajo: los artículos que están por agotarse. */
  stockBajo(): Observable<Inventario> {
    return this.http.get<Inventario>(`${API_URL}/inventario/stock-bajo`);
  }

  /** POST /api/articulos/{id}/inventario/aumentar */
  aumentarInventario(articuloId: string, cantidad: number): Observable<InventarioActualizado> {
    return this.http.post<InventarioActualizado>(`${API_URL}/articulos/${articuloId}/inventario/aumentar`, { cantidad });
  }

  /** POST /api/articulos/{id}/inventario/disminuir */
  disminuirInventario(articuloId: string, cantidad: number): Observable<InventarioActualizado> {
    return this.http.post<InventarioActualizado>(`${API_URL}/articulos/${articuloId}/inventario/disminuir`, { cantidad });
  }

  // ---------- Publicar artículo ----------

  /** GET /api/categorias: para el desplegable del formulario. */
  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API_URL}/categorias`);
  }

  /** GET /api/marcas: para el desplegable del formulario. */
  marcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${API_URL}/marcas`);
  }

  /** POST /api/articulos */
  publicarArticulo(datos: PublicarArticuloRequest): Observable<ArticuloPublicado> {
    return this.http.post<ArticuloPublicado>(`${API_URL}/articulos`, datos);
  }

  // ---------- Tienda ----------

  /** GET /api/tiendas/mia: 404 si el vendedor todavía no ha registrado una tienda. */
  miTienda(): Observable<Tienda> {
    return this.http.get<Tienda>(`${API_URL}/tiendas/mia`);
  }

  /** POST /api/tiendas: la tienda nace PENDIENTE hasta que el administrador la apruebe. */
  registrarTienda(datos: RegistrarTiendaRequest): Observable<Tienda> {
    return this.http.post<Tienda>(`${API_URL}/tiendas`, datos);
  }
}
