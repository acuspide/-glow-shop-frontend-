import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ArticuloService } from '../../servicios/articulo';
import { CalificacionService } from '../../servicios/calificacion';
import { mensajeDeError } from '../../core/errores';
import { Articulo } from '../../modelos/modelos';
import { CalificacionesArticulo } from '../../modelos/calificaciones';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

/**
 * Detalle de un artículo con sus calificaciones (segunda funcionalidad propia).
 * El artículo sale de GET /api/articulos/{id} y las reseñas de GET /api/articulos/{id}/calificaciones.
 */
@Component({
  selector: 'app-detalle-articulo',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './detalle-articulo.html',
  styleUrl: './detalle-articulo.css',
})
export class DetalleArticulo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly articuloService = inject(ArticuloService);
  private readonly calificacionService = inject(CalificacionService);

  protected readonly articulo = signal<Articulo | null>(null);
  protected readonly resenas = signal<CalificacionesArticulo | null>(null);
  protected readonly error = signal('');

  protected readonly estrellas = [1, 2, 3, 4, 5];
  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  protected readonly articuloId = this.route.snapshot.paramMap.get('id') ?? '';

  ngOnInit(): void {
    this.articuloService.obtener(this.articuloId).subscribe({
      next: (a) => this.articulo.set(a),
      error: (e) => this.error.set(mensajeDeError(e)),
    });
    this.cargarCalificaciones();
  }

  protected cargarCalificaciones(): void {
    this.calificacionService.deArticulo(this.articuloId).subscribe({
      next: (r) => this.resenas.set(r),
      error: () => this.resenas.set(null),
    });
  }
}
