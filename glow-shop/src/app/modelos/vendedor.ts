// Tipos del panel del vendedor. Cada interfaz es espejo de un DTO del backend.

import { TipoPiel, Tono } from './modelos';

export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export type EstadoTienda = 'PENDIENTE' | 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA';

// Espejo de ActualizarEstadoPedidoRequest
export interface ActualizarEstadoPedidoRequest {
  estado: EstadoPedido;
}

// Espejo de TiendaResponse
export interface Tienda {
  id: string;
  nombre: string;
  descripcion: string;
  vendedorId: string;
  estado: EstadoTienda;
}

// Espejo de RegistrarTiendaRequest
export interface RegistrarTiendaRequest {
  nombre: string;
  descripcion: string;
}

// Espejo de CategoriaResponse
export interface Categoria {
  id: string;
  nombre: string;
}

// Espejo de MarcaResponse
export interface Marca {
  id: string;
  nombre: string;
}

// Espejo de ConsultarInventarioCompletoResponse.ArticuloInventarioResponse
export interface ArticuloInventario {
  articuloId: string;
  nombre: string;
  cantidadDisponible: number;
}

// Espejo de ConsultarInventarioCompletoResponse
export interface Inventario {
  articulos: ArticuloInventario[];
}

// Espejo de ActualizarInventarioResponse
export interface InventarioActualizado {
  id: string;
  cantidadDisponible: number;
  publicado: boolean;
}

// Espejo de PublicarArticuloRequest
export interface PublicarArticuloRequest {
  nombre: string;
  precio: number;
  categoriaId: string;
  marcaId: string;
  tono: Tono;
  tiposPiel: TipoPiel[];
  cantidadDisponible: number;
  fechaVencimiento: string; // formato yyyy-MM-dd
  tiendaId: string;
}

// Espejo de PublicarArticuloResponse
export interface ArticuloPublicado {
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
  publicado: boolean;
}
