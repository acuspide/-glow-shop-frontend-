import { Component, inject, signal } from '@angular/core';

import { AuthService } from '../../servicios/auth';
import { VendedorPedidos } from '../vendedor-pedidos/vendedor-pedidos';

type Pestana = 'pedidos' | 'inventario' | 'publicar' | 'tienda';

/**
 * Panel del vendedor: una página con cuatro pestañas.
 * Cada pestaña es su propio componente; este solo decide cuál se muestra.
 */
@Component({
  selector: 'app-panel-vendedor',
  imports: [VendedorPedidos],
  templateUrl: './panel-vendedor.html',
  styleUrl: './panel-vendedor.css',
})
export class PanelVendedor {
  protected readonly auth = inject(AuthService);

  protected readonly pestanas: { id: Pestana; titulo: string }[] = [
    { id: 'pedidos', titulo: 'Pedidos' },
    { id: 'inventario', titulo: 'Inventario' },
    { id: 'publicar', titulo: 'Publicar artículo' },
    { id: 'tienda', titulo: 'Mi tienda' },
  ];

  protected readonly activa = signal<Pestana>('pedidos');

  protected seleccionar(pestana: Pestana): void {
    this.activa.set(pestana);
  }
}
