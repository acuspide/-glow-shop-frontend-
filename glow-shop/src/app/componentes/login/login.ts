import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../servicios/auth';
import { mensajeDeError } from '../../core/errores';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly verContrasena = signal(false);

  // Llegamos con ?expirada=1 cuando el token vencio.
  protected readonly sesionExpirada = this.route.snapshot.queryParamMap.has('expirada');

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const { email, contrasena } = this.formulario.getRawValue();

    this.auth.login(email, contrasena).subscribe({
      next: () => {
        // Si venia de una pagina protegida (ej. el carrito), lo devolvemos alla­.
        const destino = this.route.snapshot.queryParamMap.get('volverA');
        this.router.navigateByUrl(destino && destino.startsWith('/') ? destino : '/catalogo');
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}