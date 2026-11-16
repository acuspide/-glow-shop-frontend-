import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ArticuloService } from '../../servicios/articulo';
import { AuthService } from '../../servicios/auth';
import { CarritoService } from '../../servicios/carrito';
import { CategoriaService } from '../../servicios/categoria';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Articulo, Pagina } from '../../modelos/modelos';
import { Categoria } from '../../modelos/vendedor';
import { mensajeDeError } from '../../core/errores';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

/** Cuántos productos se piden al backend en cada página. */
const TAMANO_PAGINA = 6;

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private readonly articuloService = inject(ArticuloService);
  private readonly carritoService = inject(CarritoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly avisos = inject(NotificacionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Filtros (cada uno es un "signal": cuando cambia, la pantalla se actualiza) ---
  protected readonly texto = signal('');
  protected readonly categoriaId = signal('');
  protected readonly tono = signal('');
  protected readonly tipoPiel = signal('');

  // --- Resultados y estado de la pantalla ---
  protected readonly resultado = signal<Pagina<Articulo> | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly agregando = signal<string | null>(null);

  protected readonly tonos = ['CLARO', 'MEDIO', 'OSCURO'];
  protected readonly tiposPiel = ['SECA', 'GRASA', 'MIXTA', 'NORMAL', 'SENSIBLE'];

  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  // La página la pide Angular al backend (page y size); el backend responde number y totalPages.
  protected readonly paginaActual = computed(() => this.resultado()?.number ?? 0);
  protected readonly totalPaginas = computed(() => this.resultado()?.totalPages ?? 0);

  protected readonly hayFiltros = computed(
    () => !!(this.texto() || this.categoriaId() || this.tono() || this.tipoPiel()),
  );

  ngOnInit(): void {
    // Si viene desde el inicio con ?categoria=..., el catálogo arranca filtrado por esa categoría.
    this.categoriaId.set(this.route.snapshot.queryParamMap.get('categoria') ?? '');
    this.cargarCategorias();
    this.buscar(0);
  }

  /** GET /api/categorias: los botones de categoría salen del backend. */
  private cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => {
        // Si falla, simplemente no mostramos los botones de categoría; el error principal sale en buscar().
      },
    });
  }

  protected buscar(pagina = 0): void {
    this.cargando.set(true);
    this.error.set('');

    this.articuloService
      .buscar(
        {
          texto: this.texto(),
          categoriaId: this.categoriaId(),
          tono: this.tono(),
          tipoPiel: this.tipoPiel(),
        },
        pagina,
        TAMANO_PAGINA,
      )
      .subscribe({
        next: (respuesta) => {
          this.resultado.set(respuesta);
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(mensajeDeError(e));
          this.cargando.set(false);
        },
      });
  }

  protected cambiarTexto(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  protected elegirCategoria(id: string): void {
    this.categoriaId.set(id);
    this.buscar(0);
  }

  protected elegirTono(evento: Event): void {
    this.tono.set((evento.target as HTMLSelectElement).value);
    this.buscar(0);
  }

  protected elegirTipoPiel(evento: Event): void {
    this.tipoPiel.set((evento.target as HTMLSelectElement).value);
    this.buscar(0);
  }

  protected limpiarFiltros(): void {
    this.texto.set('');
    this.categoriaId.set('');
    this.tono.set('');
    this.tipoPiel.set('');
    this.buscar(0);
  }

  protected irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) return;
    this.buscar(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected agregar(articulo: Articulo): void {
    if (!this.auth.haySesion()) {
      this.router.navigate(['/login'], { queryParams: { volverA: '/catalogo' } });
      return;
    }
    if (!this.auth.esCliente()) {
      this.avisos.error('Solo las cuentas de cliente pueden comprar.');
      return;
    }

    this.agregando.set(articulo.id);
    this.carritoService.agregar(articulo.id, 1).subscribe({
      next: () => {
        this.agregando.set(null);
        this.avisos.exito(`«${articulo.nombre}» se agregó a tu carrito.`);
      },
      error: (e) => {
        this.agregando.set(null);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }

}
