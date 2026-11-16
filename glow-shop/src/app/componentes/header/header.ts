import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../servicios/auth';
import { CarritoService } from '../../servicios/carrito';

/**
 * Menú principal. Cambia según la sesión: sin sesión muestra "Iniciar sesión";
 * con sesión muestra el saludo, las opciones privadas y "Cerrar sesión".
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);

  constructor() {
    // En el celular el menú queda abierto al cambiar de página; lo cerramos al navegar.
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => document.getElementById('menuPrincipal')?.classList.remove('show'));
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
