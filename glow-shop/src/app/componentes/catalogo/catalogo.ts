import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ArticuloService } from '../../servicios/articulo';
import { AuthService } from '../../servicios/auth';
import { CarritoService } from '../../servicios/carrito';
import { CategoriaService } from '../../servicios/categoria';
import { NotificacionesService } from '../../servicios/notificaciones';
import { Articulo, FiltrosBusqueda, Pagina } from '../../modelos/modelos';
import { Categoria } from '../../modelos/vendedor';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import { mensajeDeError } from '../../core/errores';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

/** Cuántos productos se piden al backend en cada página. */
const TAMANO_PAGINA = 6;

/** Espera después de la última tecla antes de buscar (para no pedir en cada tecla). */
const ESPERA_BUSQUEDA_MS = 400;

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

  /** Los cuatro filtros combinados en una sola señal: si cambia cualquiera, cambia esta. */
  private readonly filtros = computed<FiltrosBusqueda>(() => ({
    texto: this.texto(),
    categoriaId: this.categoriaId(),
    tono: this.tono(),
    tipoPiel: this.tipoPiel(),
  }));

  /** Cada número que entra aquí es una página que hay que pedirle al backend. */
  private readonly paginaPedida = new Subject<number>();

  protected readonly hayFiltros = computed(
    () => !!(this.texto() || this.categoriaId() || this.tono() || this.tipoPiel()),
  );

  constructor() {
    // Búsqueda reactiva: cuando cambian los filtros (por ejemplo al escribir), se espera
    // 400 ms sin cambios y se pide la página 0. Así no se hace una petición por cada tecla.
    toObservable(this.filtros)
      .pipe(
        debounceTime(ESPERA_BUSQUEDA_MS),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.paginaPedida.next(0));

    // switchMap: si llega una búsqueda nueva mientras la anterior no ha respondido,
    // se cancela la anterior para que una respuesta vieja no pise a la nueva.
    this.paginaPedida
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set('');
        }),
        switchMap((pagina) =>
          this.articuloService.buscar(this.filtros(), pagina, TAMANO_PAGINA).pipe(
            catchError((e) => {
              this.error.set(mensajeDeError(e));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        if (respuesta) {
          this.resultado.set(respuesta);
        }
        this.cargando.set(false);
      });
  }

  ngOnInit(): void {
    // Si viene desde el inicio con ?categoria=..., el catálogo arranca filtrado por esa categoría.
    this.categoriaId.set(this.route.snapshot.queryParamMap.get('categoria') ?? '');
    // Si viene desde "Nuestros favoritos" con ?texto=..., arranca con esa búsqueda.
    this.texto.set(this.route.snapshot.queryParamMap.get('texto') ?? '');
    this.cargarCategorias();
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

  /** Pide una página al backend con los filtros actuales (paginación y "Intentar de nuevo"). */
  protected buscar(pagina = 0): void {
    this.paginaPedida.next(pagina);
  }

  protected cambiarTexto(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  protected elegirCategoria(id: string): void {
    this.categoriaId.set(id);
  }

  protected elegirTono(evento: Event): void {
    this.tono.set((evento.target as HTMLSelectElement).value);
  }

  protected elegirTipoPiel(evento: Event): void {
    this.tipoPiel.set((evento.target as HTMLSelectElement).value);
  }

  protected limpiarFiltros(): void {
    this.texto.set('');
    this.categoriaId.set('');
    this.tono.set('');
    this.tipoPiel.set('');
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
