import { Component, inject } from '@angular/core';

import { NotificacionesService } from '../../servicios/notificaciones';

/** Pinta los avisos del NotificacionesService en la esquina superior derecha. */
@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones {
  protected readonly servicio = inject(NotificacionesService);
}
