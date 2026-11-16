import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Pedido } from '../modelos/modelos';

/** Endpoints de los pedidos del cliente. El cliente sale del token, por eso no se manda su id. */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  /** GET /api/pedidos: los pedidos del cliente con sesión. */
  misPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${API_URL}/pedidos`);
  }
}
