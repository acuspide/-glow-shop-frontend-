export interface Auth {}// Estos tipos reflejan los DTO (records) del backend de Spring Boot.

export type RolUsuario = 'CLIENTE' | 'VENDEDOR' | 'ADMINISTRADOR';
export type Tono = 'CLARO' | 'MEDIO' | 'OSCURO';
export type TipoPiel = 'SECA' | 'GRASA' | 'MIXTA' | 'NORMAL' | 'SENSIBLE';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  contrasena: string;
  telefono: string;
  fechaNacimiento: string; // formato yyyy-MM-dd
}

export interface Articulo {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  categoriaNombre: string;
  marcaId: string;
  marcaNombre: string;
  tono: string;
  tiposPiel: string[];
  cantidadDisponible: number;
  fechaVencimiento: string;
  tiendaId: string;
  tiendaNombre: string;
}

export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FiltrosBusqueda {
  texto?: string;
  categoriaId?: string;
  tono?: string;
  tipoPiel?: string;
}

export interface ItemCarrito {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Carrito {
  id: string;
  clienteId: string;
  items: ItemCarrito[];
  total: number;
}

export interface DetallePedido {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  tiendaId: string;
  estado: string;
  pagado: boolean;
  detalles: DetallePedido[];
  subtotal: number;
  total: number;
}
