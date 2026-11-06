import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../../servicios/auth';
import { mensajeDeError } from '../../core/errores';

// Las mismas reglas que valida el backend:
//  - contrasena: mi­nimo 8 caracteres, una mayuscula y un numero
//  - telefono: de 7 a 15 di­gitos, con "+" opcional al inicio
const PATRON_CONTRASENA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PATRON_TELEFONO = /^\+?\d{7,15}$/;

function contrasenasIguales(grupo: AbstractControl): ValidationErrors | null {
  const a = grupo.get('contrasena')?.value;
  const b = grupo.get('confirmar')?.value;
  return a === b ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly hoy = new Date().toISOString().slice(0, 10);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(PATRON_TELEFONO)]],
      fechaNacimiento: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]],
      confirmar: ['', Validators.required],
    },
    { validators: [contrasenasIguales] },
  );

  /** Devuelve true si el campo fue tocado y es invalido (para mostrar el error). */
  protected malo(campo: 'nombre' | 'email' | 'telefono' | 'fechaNacimiento' | 'contrasena'): boolean {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid;
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const { nombre, email, telefono, fechaNacimiento, contrasena } = this.formulario.getRawValue();

    // 1) Creamos la cuenta y 2) iniciamos sesionn de una vez con esos datos.
    this.auth
      .registrar({ nombre: nombre.trim(), email: email.trim(), telefono, fechaNacimiento, contrasena })
      .pipe(switchMap(() => this.auth.login(email.trim(), contrasena)))
      .subscribe({
        next: () => this.router.navigateByUrl('/catalogo'),
        error: (e) => {
          this.error.set(mensajeDeError(e));
          this.enviando.set(false);
        },
      });
  }
}

