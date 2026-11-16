import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
}

/**
 * Avisos cortos para toda la aplicación (éxito, error o información).
 * Cualquier pantalla o servicio los pide aquí y el componente <app-notificaciones>
 * los muestra. Cada aviso desaparece solo a los 4 segundos.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private siguienteId = 0;

  readonly avisos = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  quitar(id: number): void {
    this.avisos.update((lista) => lista.filter((aviso) => aviso.id !== id));
  }

  private mostrar(tipo: Aviso['tipo'], texto: string): void {
    const id = ++this.siguienteId;
    this.avisos.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.quitar(id), 4000);
  }
}
