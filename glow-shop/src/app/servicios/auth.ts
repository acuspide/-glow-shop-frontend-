import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from '../core/api-config';
import { LoginResponse, RegistroRequest, Usuario } from '../modelos/modelos';

const CLAVE_SESION = 'glow_sesion';

/**
 * Maneja la sesion: iniciar sesion, registrarse y cerrar sesion.
 * Guarda el token JWT en localStorage para que la sesion sobreviva a recargar la pagina.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesion = signal<LoginResponse | null>(this.leerSesionGuardada());

  readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  readonly token = computed<string | null>(() => this.sesion()?.token ?? null);
  readonly haySesion = computed(() => this.sesion() !== null);
  readonly esCliente = computed(() => this.sesion()?.usuario.rol === 'CLIENTE');

  login(email: string, contrasena: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { email, contrasena })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  registrar(datos: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_URL}/usuarios`, datos);
  }

  cerrarSesion(): void {
    const terminar = () => {
      this.borrarSesion();
      this.router.navigateByUrl('/');
    };
    // Avisamos al backend; si falla (token vencido, etc.) igual cerramos la sesion aqui≠.
    this.http.post<void>(`${API_URL}/auth/logout`, {}).subscribe({ next: terminar, error: terminar });
  }

  /** Se usa cuando el backend responde 401 (token vencido o inv√°lido). */
  sesionExpirada(): void {
    this.borrarSesion();
    this.router.navigate(['/login'], { queryParams: { expirada: '1' } });
  }

  private guardarSesion(respuesta: LoginResponse): void {
    this.sesion.set(respuesta);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(respuesta));
    } catch {
      // Si el navegador bloquea el almacenamiento, la sesion dura solo hasta recargar.
    }
  }

  private borrarSesion(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // nada que hacer
    }
  }

  private leerSesionGuardada(): LoginResponse | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      return texto ? (JSON.parse(texto) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}

