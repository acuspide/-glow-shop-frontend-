import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { VendedorService } from '../../servicios/vendedor';
import { NotificacionesService } from '../../servicios/notificaciones';
import { mensajeDeError } from '../../core/errores';
import { TipoPiel, Tono } from '../../modelos/modelos';
import { Categoria, Marca, Tienda } from '../../modelos/vendedor';

/** Al menos un tipo de piel marcado (el backend exige mínimo uno). */
function alMenosUno(control: AbstractControl): ValidationErrors | null {
  return (control.value as TipoPiel[]).length > 0 ? null : { ninguno: true };
}

/** La fecha de vencimiento tiene que ser posterior a hoy. */
function fechaFutura(control: AbstractControl): ValidationErrors | null {
  const hoy = new Date().toISOString().slice(0, 10);
  return control.value && control.value <= hoy ? { pasada: true } : null;
}

/**
 * Pestaña "Publicar artículo" del panel del vendedor.
 * Formulario reactivo que hace POST /api/articulos (protegido: el token lo pone el interceptor).
 */
@Component({
  selector: 'app-vendedor-publicar',
  imports: [ReactiveFormsModule],
  templateUrl: './vendedor-publicar.html',
})
export class VendedorPublicar implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vendedorService = inject(VendedorService);
  private readonly avisos = inject(NotificacionesService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly marcas = signal<Marca[]>([]);
  protected readonly tienda = signal<Tienda | null>(null);
  protected readonly sinTienda = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected readonly tonos: Tono[] = ['CLARO', 'MEDIO', 'OSCURO'];
  protected readonly tiposPielDisponibles: TipoPiel[] = ['SECA', 'GRASA', 'MIXTA', 'NORMAL', 'SENSIBLE'];

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precio: [0, [Validators.required, Validators.min(1)]],
    categoriaId: ['', Validators.required],
    marcaId: ['', Validators.required],
    tono: ['' as Tono | '', Validators.required],
    tiposPiel: this.fb.nonNullable.control<TipoPiel[]>([], alMenosUno),
    cantidadDisponible: [1, [Validators.required, Validators.min(0)]],
    fechaVencimiento: ['', [Validators.required, fechaFutura]],
  });

  ngOnInit(): void {
    // Los desplegables salen del backend, no están escritos a mano.
    this.vendedorService.categorias().subscribe({ next: (c) => this.categorias.set(c) });
    this.vendedorService.marcas().subscribe({ next: (m) => this.marcas.set(m) });
    // El id de la tienda también: GET /api/tiendas/mia responde 404 si el vendedor no tiene tienda.
    this.vendedorService.miTienda().subscribe({
      next: (t) => this.tienda.set(t),
      error: () => this.sinTienda.set(true),
    });
  }

  /** true si el campo fue tocado y no es válido (para pintarlo en rojo). */
  protected malo(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid;
  }

  protected marcado(tipo: TipoPiel): boolean {
    return this.formulario.controls.tiposPiel.value.includes(tipo);
  }

  protected alternarTipoPiel(tipo: TipoPiel): void {
    const control = this.formulario.controls.tiposPiel;
    const actual = control.value;
    control.setValue(actual.includes(tipo) ? actual.filter((t) => t !== tipo) : [...actual, tipo]);
    control.markAsTouched();
  }

  protected publicar(): void {
    const tienda = this.tienda();
    if (this.formulario.invalid || !tienda) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    const datos = this.formulario.getRawValue();

    this.vendedorService
      .publicarArticulo({ ...datos, nombre: datos.nombre.trim(), tono: datos.tono as Tono, tiendaId: tienda.id })
      .subscribe({
        next: (articulo) => {
          this.avisos.exito(`«${articulo.nombre}» quedó publicado en el catálogo.`);
          this.formulario.reset();
          this.enviando.set(false);
        },
        error: (e) => {
          const mensaje = mensajeDeError(e);
          this.error.set(mensaje);
          this.avisos.error(mensaje);
          this.enviando.set(false);
        },
      });
  }
}
