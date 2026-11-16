import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoriaService } from '../../servicios/categoria';
import { Categoria } from '../../modelos/vendedor';
import { claseColor } from '../../utilidades/visual';

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

  /** Las categorías ya no están escritas en el HTML: salen de GET /api/categorias. */
  protected readonly categorias = signal<Categoria[]>([]);

  protected readonly claseColor = claseColor;

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.categorias.set([]),
    });
  }

  protected simbolo(posicion: number): string {
    return SIMBOLOS[posicion % SIMBOLOS.length];
  }
}
