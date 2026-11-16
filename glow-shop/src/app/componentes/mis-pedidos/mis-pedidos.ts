import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PedidoService } from '../../servicios/pedido';
import { ArticuloService } from '../../servicios/articulo';
import { PagoService } from '../../servicios/pago';
import { NotificacionesService } from '../../servicios/notificaciones';
import { mensajeDeError } from '../../core/errores';
import { Pedido } from '../../modelos/modelos';
import { MedioPago, Pago } from '../../modelos/pagos';

/** Texto y color (clase de Bootstrap) de cada estado del pedido. */
const ESTADOS: Record<string, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'text-bg-secondary' },
  CONFIRMADO: { texto: 'Esperando pago', clase: 'text-bg-warning' },
  EN_PREPARACION: { texto: 'En preparación', clase: 'text-bg-info' },
  ENVIADO: { texto: 'Enviado', clase: 'text-bg-primary' },
  ENTREGADO: { texto: 'Entregado', clase: 'text-bg-success' },
  CANCELADO: { texto: 'Cancelado', clase: 'text-bg-dark' },
};

/**
 * "Mis pedidos": los pedidos del cliente con sesión (GET /api/pedidos).
 * Funcionalidad propia: pago simulado con confirmación automática. La pasarela simulada
 * del backend aprueba o rechaza al instante, y si aprueba el pedido queda pagado.
 */
@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './mis-pedidos.html',
})
export class MisPedidos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pedidoService = inject(PedidoService);
  private readonly articuloService = inject(ArticuloService);
  private readonly pagoService = inject(PagoService);
  private readonly avisos = inject(NotificacionesService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  /** Nombre de cada artículo (el pedido solo trae el id), para los enlaces de "Calificar". */
  protected readonly nombres = signal<Partial<Record<string, string>>>({});

  // --- Pago ---
  protected readonly mediosDePago: { valor: MedioPago; texto: string; icono: string }[] = [
    { valor: 'TARJETA_CREDITO', texto: 'Tarjeta de crédito', icono: 'fa-credit-card' },
    { valor: 'TARJETA_DEBITO', texto: 'Tarjeta débito', icono: 'fa-money-check' },
    { valor: 'PSE', texto: 'PSE', icono: 'fa-building-columns' },
    { valor: 'NEQUI', texto: 'Nequi', icono: 'fa-mobile-screen' },
  ];
  /** Pedido cuyo formulario de pago está abierto (solo uno a la vez). */
  protected readonly pagandoId = signal<string | null>(null);
  protected readonly enviando = signal(false);
  /** Último pago rechazado de cada pedido: el siguiente intento se hace como reintento. */
  protected readonly rechazos = signal<Record<string, Pago>>({});

  protected readonly formularioPago = this.fb.nonNullable.group({
    medioPago: ['' as MedioPago | '', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
    this.articuloService.listar().subscribe({
      next: (articulos) => this.nombres.set(Object.fromEntries(articulos.map((a) => [a.id, a.nombre]))),
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.pedidoService.misPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  /** Un pedido CONFIRMADO que todavía no tiene un pago aprobado. */
  protected esperaPago(pedido: Pedido): boolean {
    return pedido.estado === 'CONFIRMADO' && !pedido.pagado;
  }

  protected estado(pedido: Pedido): { texto: string; clase: string } {
    if (pedido.estado === 'CONFIRMADO' && pedido.pagado) {
      return { texto: 'Pagado', clase: 'text-bg-success' };
    }
    return ESTADOS[pedido.estado] ?? { texto: pedido.estado, clase: 'text-bg-secondary' };
  }

  protected abrirPago(pedido: Pedido): void {
    this.formularioPago.reset();
    this.pagandoId.set(this.pagandoId() === pedido.id ? null : pedido.id);
  }

  protected pagar(pedido: Pedido): void {
    if (this.formularioPago.invalid) {
      this.formularioPago.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const medioPago = this.formularioPago.getRawValue().medioPago as MedioPago;
    const rechazoAnterior = this.rechazos()[pedido.id];

    // Si ya hubo un rechazo se usa el endpoint de reintento; si no, el de pago normal.
    const peticion = rechazoAnterior
      ? this.pagoService.reintentar(rechazoAnterior.id, { medioPago })
      : this.pagoService.pagar(pedido.id, { medioPago });

    peticion.subscribe({
      next: (pago) => {
        this.enviando.set(false);
        if (pago.estado === 'APROBADO') {
          this.avisos.exito(`Pago aprobado al instante. Transacción ${pago.transaccionId}.`);
          this.pagandoId.set(null);
          this.cargar();
        } else {
          this.rechazos.update((r) => ({ ...r, [pedido.id]: pago }));
          this.avisos.error(`Pago rechazado: ${pago.motivoRechazo}. Intenta con otro medio de pago.`);
        }
      },
      error: (e) => {
        this.enviando.set(false);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }
}
