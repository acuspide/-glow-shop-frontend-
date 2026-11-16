import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';

import { mensajeDeError } from '../../core/errores';
import { Pedido } from '../../modelos/modelos';
import { EstadoPedido } from '../../modelos/vendedor';
import { VendedorService } from '../../servicios/vendedor';

type Filtro = 'todos' | 'esperando-pago' | 'por-preparar' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO';

/** El siguiente paso que puede dar el vendedor con un pedido (o null si ya no hay ninguno). */
interface Accion {
  destino: EstadoPedido;
  texto: string;
}

/**
 * Pestaña "Pedidos" del panel del vendedor: lista los pedidos de su tienda
 * y le permite avanzarlos: preparar → enviar → entregar.
 * Las reglas (orden de los estados, no preparar sin pago) las aplica el backend;
 * aquí solo se muestra el botón que tiene sentido y el mensaje si algo falla.
 */
@Component({
  selector: 'app-vendedor-pedidos',
  imports: [CurrencyPipe],
  templateUrl: './vendedor-pedidos.html',
  styleUrl: './vendedor-pedidos.css',
})
export class VendedorPedidos implements OnInit {
  private readonly vendedor = inject(VendedorService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pedidos = signal<Pedido[]>([]);
  /** articuloId -> nombre, para mostrar "2 × Labial Mate" en lugar del id. */
  private readonly nombres = signal<Record<string, string>>({});

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Id del pedido que se está actualizando, para deshabilitar su botón. */
  protected readonly procesando = signal<string | null>(null);
  /** Errores por pedido: se muestran debajo de la tarjeta que falló. */
  protected readonly erroresPorPedido = signal<Record<string, string>>({});

  protected readonly filtro = signal<Filtro>('todos');

  protected readonly filtros: { id: Filtro; texto: string }[] = [
    { id: 'todos', texto: 'Todos' },
    { id: 'esperando-pago', texto: 'Esperando pago' },
    { id: 'por-preparar', texto: 'Por preparar' },
    { id: 'EN_PREPARACION', texto: 'En preparación' },
    { id: 'ENVIADO', texto: 'Enviados' },
    { id: 'ENTREGADO', texto: 'Entregados' },
  ];

  protected readonly visibles = computed(() =>
    this.pedidos().filter((p) => this.cumpleFiltro(p, this.filtro())),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    // Los pedidos traen solo el id de cada artículo; el inventario de la tienda trae su nombre.
    // Si el inventario falla, los pedidos igual se muestran (con el id en lugar del nombre).
    const inventario = this.vendedor.inventario().pipe(catchError(() => of({ articulos: [] })));

    forkJoin({ pedidos: this.vendedor.pedidos(), inventario })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pedidos, inventario }) => {
          const nombres: Record<string, string> = {};
          inventario.articulos.forEach((a) => (nombres[a.articuloId] = a.nombre));
          this.nombres.set(nombres);
          this.pedidos.set(pedidos);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(mensajeDeError(e));
          this.cargando.set(false);
        },
      });
  }

  protected cantidadEn(filtro: Filtro): number {
    return this.pedidos().filter((p) => this.cumpleFiltro(p, filtro)).length;
  }

  protected nombreDe(articuloId: string): string {
    return this.nombres()[articuloId] ?? articuloId;
  }

  /** El botón que corresponde según el estado. Sin pago no se ofrece preparar. */
  protected siguientePaso(pedido: Pedido): Accion | null {
    switch (pedido.estado) {
      case 'CONFIRMADO':
        return pedido.pagado ? { destino: 'EN_PREPARACION', texto: 'Iniciar preparación' } : null;
      case 'EN_PREPARACION':
        return { destino: 'ENVIADO', texto: 'Marcar como enviado' };
      case 'ENVIADO':
        return { destino: 'ENTREGADO', texto: 'Marcar como entregado' };
      default:
        return null;
    }
  }

  protected avanzar(pedido: Pedido, accion: Accion): void {
    this.procesando.set(pedido.id);
    this.quitarError(pedido.id);

    this.vendedor
      .cambiarEstado(pedido.id, accion.destino)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          // Se reemplaza solo ese pedido en la lista, con lo que respondió el backend.
          this.pedidos.update((lista) => lista.map((p) => (p.id === actualizado.id ? actualizado : p)));
          this.procesando.set(null);
        },
        error: (e) => {
          this.erroresPorPedido.update((errores) => ({ ...errores, [pedido.id]: mensajeDeError(e) }));
          this.procesando.set(null);
        },
      });
  }

  protected textoEstado(pedido: Pedido): string {
    switch (pedido.estado) {
      case 'CONFIRMADO':
        return pedido.pagado ? 'Pago recibido' : 'Esperando pago';
      case 'EN_PREPARACION':
        return 'En preparación';
      case 'ENVIADO':
        return 'Enviado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return pedido.estado;
    }
  }

  private cumpleFiltro(pedido: Pedido, filtro: Filtro): boolean {
    switch (filtro) {
      case 'todos':
        return true;
      case 'esperando-pago':
        return pedido.estado === 'CONFIRMADO' && !pedido.pagado;
      case 'por-preparar':
        return pedido.estado === 'CONFIRMADO' && pedido.pagado;
      default:
        return pedido.estado === filtro;
    }
  }

  private quitarError(pedidoId: string): void {
    this.erroresPorPedido.update((errores) => {
      const { [pedidoId]: _, ...resto } = errores;
      return resto;
    });
  }
}
