import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ArticuloService } from '../../servicios/articulo';
import { AuthService } from '../../servicios/auth';
import { CarritoService } from '../../servicios/carrito';
import { Articulo, Pagina } from '../../modelos/modelos';
import { mensajeDeError } from '../../core/errores';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

interface CategoriaOpcion {
  id: string;
  nombre: string;
}

interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
}

@Component({
  selector: 'app-catalogo',
  imports: [CurrencyPipe],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private readonly articuloService = inject(ArticuloService);
  private readonly carritoService = inject(CarritoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // --- Filtros (cada uno es un "signal": cuando cambia, la pantalla se actualiza) ---
  protected readonly texto = signal('');
  protected readonly categoriaId = signal('');
  protected readonly tono = signal('');
  protected readonly tipoPiel = signal('');

  // --- Resultados y estado de la pantalla ---
  protected readonly resultado = signal<Pagina<Articulo> | null>(null);
  protected readonly categorias = signal<CategoriaOpcion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly agregando = signal<string | null>(null);
  protected readonly aviso = signal<Aviso | null>(null);

  protected readonly tonos = ['CLARO', 'MEDIO', 'OSCURO'];
  protected readonly tiposPiel = ['SECA', 'GRASA', 'MIXTA', 'NORMAL', 'SENSIBLE'];
  protected readonly esqueletos = [1, 2, 3, 4, 5, 6];

  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  protected readonly numeroPaginas = computed(() =>
    Array.from({ length: this.resultado()?.totalPages ?? 0 }, (_, i) => i),
  );

  protected readonly hayFiltros = computed(
    () => !!(this.texto() || this.categoriaId() || this.tono() || this.tipoPiel()),
  );

  private temporizadorAviso: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.cargarCategorias();
    this.buscar(0);
  }

  /** Las categorías salen de los artículos existentes (el backend no tiene un GET de categorías). */
  private cargarCategorias(): void {
    this.articuloService.listar().subscribe({
      next: (articulos) => {
        const unicas = new Map<string, string>();
        for (const a of articulos) {
          unicas.set(a.categoriaId, a.categoriaNombre);
        }
        const lista = [...unicas].map(([id, nombre]) => ({ id, nombre }));
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.categorias.set(lista);
      },
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
    const total = this.resultado()?.totalPages ?? 0;
    if (pagina < 0 || pagina >= total) return;
    this.buscar(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected agregar(articulo: Articulo): void {
    if (!this.auth.haySesion()) {
      this.router.navigate(['/login'], { queryParams: { volverA: '/catalogo' } });
      return;
    }
    if (!this.auth.esCliente()) {
      this.mostrarAviso('error', 'Solo las cuentas de cliente pueden comprar.');
      return;
    }

    this.agregando.set(articulo.id);
    this.carritoService.agregar(articulo.id, 1).subscribe({
      next: () => {
        this.agregando.set(null);
        this.mostrarAviso('exito', `«${articulo.nombre}» se agregó a tu carrito.`);
      },
      error: (e) => {
        this.agregando.set(null);
        this.mostrarAviso('error', mensajeDeError(e));
      },
    });
  }

  private mostrarAviso(tipo: Aviso['tipo'], texto: string): void {
    clearTimeout(this.temporizadorAviso);
    this.aviso.set({ tipo, texto });
    this.temporizadorAviso = setTimeout(() => this.aviso.set(null), 3800);
  }
}
