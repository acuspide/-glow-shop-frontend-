import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoriaService } from '../../servicios/categoria';
import { ReporteService } from '../../servicios/reporte';
import { Categoria } from '../../modelos/vendedor';
import { ArticuloVentas } from '../../modelos/modelos';
import { claseColor, etiquetaEnvase } from '../../utilidades/visual';

/** Símbolos decorativos que se reparten entre las categorías. */
const SIMBOLOS = ['✿', '♡', '❀', '✧', '✦'];

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly reporteService = inject(ReporteService);

  /** Las categorías ya no están escritas en el HTML: salen de GET /api/categorias. */
  protected readonly categorias = signal<Categoria[]>([]);

  /** "Nuestros favoritos" son los 3 más vendidos de verdad: salen del ranking del backend. */
  protected readonly favoritos = signal<ArticuloVentas[]>([]);

  protected readonly claseColor = claseColor;
  protected readonly etiquetaEnvase = etiquetaEnvase;

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.categorias.set([]),
    });
    this.reporteService.masVendidos(3).subscribe({
      next: (ranking) => this.favoritos.set(ranking),
      error: () => this.favoritos.set([]),
    });
  }

  protected simbolo(posicion: number): string {
    return SIMBOLOS[posicion % SIMBOLOS.length];
  }
}
