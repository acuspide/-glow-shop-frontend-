import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './servicios/auth';
import { CarritoService } from './servicios/carrito';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);

  constructor() {
    // Cada vez que cambia la sesion: si es un cliente, traemos su carrito; si no, lo limpiamos.
    effect(() => {
      const esCliente = this.auth.esCliente();
      untracked(() => {
        if (esCliente) {
          this.carrito.cargar().subscribe({ error: () => this.carrito.limpiar() });
        } else {
          this.carrito.limpiar();
        }
      });
    });
  }
  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}