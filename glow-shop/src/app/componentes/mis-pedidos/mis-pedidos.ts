import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PedidoService } from '../../servicios/pedido';
import { mensajeDeError } from '../../core/errores';
import { Pedido } from '../../modelos/modelos';

/** Texto y color (clase de Bootstrap) de cada estado del pedido. */
const ESTADOS: Record<string, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'text-bg-secondary' },
  CONFIRMADO: { texto: 'Esperando pago', clase: 'text-bg-warning' },
  EN_PREPARACION: { texto: 'En preparación', clase: 'text-bg-info' },
  ENVIADO: { texto: 'Enviado', clase: 'text-bg-primary' },
  ENTREGADO: { texto: 'Entregado', clase: 'text-bg-success' },
  CANCELADO: { texto: 'Cancelado', clase: 'text-bg-dark' },
};

/** "Mis pedidos": los pedidos del cliente con sesión (GET /api/pedidos). */
@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './mis-pedidos.html',
})
export class MisPedidos implements OnInit {
  private readonly pedidoService = inject(PedidoService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
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
}
