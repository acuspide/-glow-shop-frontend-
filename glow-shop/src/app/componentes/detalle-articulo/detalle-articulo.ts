import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ArticuloService } from '../../servicios/articulo';
import { CalificacionService } from '../../servicios/calificacion';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';
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
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './detalle-articulo.html',
  styleUrl: './detalle-articulo.css',
})
export class DetalleArticulo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly articuloService = inject(ArticuloService);
  private readonly calificacionService = inject(CalificacionService);
  private readonly fb = inject(FormBuilder);
  private readonly avisos = inject(NotificacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly articulo = signal<Articulo | null>(null);
  protected readonly resenas = signal<CalificacionesArticulo | null>(null);
  protected readonly error = signal('');

  protected readonly estrellas = [1, 2, 3, 4, 5];
  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  protected readonly articuloId = this.route.snapshot.paramMap.get('id') ?? '';

  // --- Formulario para calificar (solo clientas; el backend exige que ya lo haya recibido) ---
  protected readonly enviando = signal(false);
  protected readonly errorCalificar = signal('');
  protected readonly formulario = this.fb.nonNullable.group({
    puntuacion: [0, [Validators.min(1), Validators.max(5)]],
    comentario: ['', [Validators.required, Validators.maxLength(500)]],
  });

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

  protected elegirEstrellas(n: number): void {
    this.formulario.controls.puntuacion.setValue(n);
    this.formulario.controls.puntuacion.markAsTouched();
  }

  protected calificar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorCalificar.set('');
    const { puntuacion, comentario } = this.formulario.getRawValue();

    this.calificacionService.calificar(this.articuloId, { puntuacion, comentario: comentario.trim() }).subscribe({
      next: () => {
        this.avisos.exito('¡Gracias! Tu calificación quedó publicada.');
        this.formulario.reset();
        this.enviando.set(false);
        this.cargarCalificaciones();
      },
      error: (e) => {
        // 422 si todavía no recibió el artículo, 409 si ya lo había calificado.
        const mensaje = mensajeDeError(e);
        this.errorCalificar.set(mensaje);
        this.avisos.error(mensaje);
        this.enviando.set(false);
      },
    });
  }
}
