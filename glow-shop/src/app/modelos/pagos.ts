// Espejos de los DTOs de pagos del backend.

export type MedioPago = 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'PSE' | 'NEQUI';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';

// Espejo de ProcesarPagoRequest
export interface ProcesarPagoRequest {
  medioPago: MedioPago;
}

// Espejo de ReintentarPagoRequest (el medio es opcional: sin él se reintenta con el mismo)
export interface ReintentarPagoRequest {
  medioPago?: MedioPago;
}

// Espejo de PagoResponse
export interface Pago {
  id: string;
  pedidoId: string;
  monto: number;
  medioPago: MedioPago;
  fechaPago: string;
  estado: EstadoPago;
  transaccionId: string | null;
  motivoRechazo: string | null;
}
