import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../core/api-config';
import { Pago, ProcesarPagoRequest, ReintentarPagoRequest } from '../modelos/pagos';

/**
 * Endpoints de pagos. El cobro lo hace la pasarela simulada del backend,
 * que aprueba o rechaza al instante (confirmación automática).
 */
@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly http = inject(HttpClient);

  /** POST /api/pedidos/{pedidoId}/pagos: responde 201 con el pago APROBADO o RECHAZADO. */
  pagar(pedidoId: string, solicitud: ProcesarPagoRequest): Observable<Pago> {
    return this.http.post<Pago>(`${API_URL}/pedidos/${pedidoId}/pagos`, solicitud);
  }

  /** POST /api/pagos/{id}/reintentos: vuelve a intentar un pago rechazado, si se quiere con otro medio. */
  reintentar(pagoId: string, solicitud: ReintentarPagoRequest): Observable<Pago> {
    return this.http.post<Pago>(`${API_URL}/pagos/${pagoId}/reintentos`, solicitud);
  }
}
