import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { ArticuloService } from '../../servicios/articulo';
import { CarritoService } from '../../servicios/carrito';
import { Articulo, ItemCarrito, Pedido } from '../../modelos/modelos';
import { mensajeDeError } from '../../core/errores';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

interface Fila {
  item: ItemCarrito;
  articulo?: Articulo;
}

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  private readonly carritoService = inject(CarritoService);
  private readonly articuloService = inject(ArticuloService);

  protected readonly carrito = this.carritoService.carrito;
  protected readonly articulos = signal<Map<string, Articulo>>(new Map());

  protected readonly cargando = signal(true);
  protected readonly trabajando = signal(false);
  protected readonly error = signal('');
  protected readonly pedidos = signal<Pedido[] | null>(null);

  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  /** Cada ítem del carrito junto con los datos del artículo (el backend solo devuelve el id). */
  protected readonly filas = computed<Fila[]>(() =>
    (this.carrito()?.items ?? []).map((item) => ({ item, articulo: this.articulos().get(item.articuloId) })),
  );

  protected readonly totalPedidos = computed(() => (this.pedidos() ?? []).reduce((s, p) => s + p.total, 0));

  ngOnInit(): void {
    forkJoin({ carrito: this.carritoService.cargar(), articulos: this.articuloService.listar() }).subscribe({
      next: ({ articulos }) => {
        this.articulos.set(new Map(articulos.map((a) => [a.id, a])));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  /** True si ya pidió todo el stock disponible de ese producto. */
  protected alLimite(fila: Fila): boolean {
    return !!fila.articulo && fila.item.cantidad >= fila.articulo.cantidadDisponible;
  }

  protected cambiarCantidad(fila: Fila, cambio: number): void {
    const nueva = fila.item.cantidad + cambio;
    if (nueva < 1) return;
    this.ejecutar(this.carritoService.cambiarCantidad(fila.item.articuloId, nueva));
  }

  protected quitar(fila: Fila): void {
    this.ejecutar(this.carritoService.quitar(fila.item.articuloId));
  }

  protected vaciar(): void {
    this.ejecutar(this.carritoService.vaciar());
  }

  protected confirmar(): void {
    this.trabajando.set(true);
    this.error.set('');

    this.carritoService
      .confirmarPedido()
      // Después de confirmar, refrescamos el carrito (el backend lo deja vacío) y devolvemos los pedidos.
      .pipe(switchMap((pedidos) => this.carritoService.cargar().pipe(map(() => pedidos))))
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
          this.trabajando.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (e) => {
          this.error.set(mensajeDeError(e));
          this.trabajando.set(false);
        },
      });
  }

  /** Ejecuta un cambio en el carrito y luego vuelve a pedir el carrito actualizado. */
  private ejecutar(accion: Observable<unknown>): void {
    this.trabajando.set(true);
    this.error.set('');

    accion.pipe(switchMap(() => this.carritoService.cargar())).subscribe({
      next: () => this.trabajando.set(false),
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.trabajando.set(false);
      },
    });
  }
}