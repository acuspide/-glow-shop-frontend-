import { Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './servicios/auth';
import { CarritoService } from './servicios/carrito';
import { Header } from './componentes/header/header';
import { Footer } from './componentes/footer/footer';
import { Notificaciones } from './componentes/notificaciones/notificaciones';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Notificaciones],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);

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
}