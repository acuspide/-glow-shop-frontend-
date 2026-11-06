const PALETA = ['rosa', 'lila', 'beige', 'menta'] as const;

/**
 * Devuelve siempre el mismo color para la misma categoría
 * (así cada categoría tiene su "identidad" en las tarjetas).
 */
export function claseColor(texto: string | undefined | null): string {
  const base = texto ?? '';
  let suma = 0;
  for (let i = 0; i < base.length; i++) {
    suma += base.charCodeAt(i);
  }
  return PALETA[suma % PALETA.length];
}

/** Primera palabra de la marca en mayúsculas, para el "envase" decorativo. */
export function etiquetaEnvase(marca: string | undefined | null): string {
  return (marca ?? 'GLOW').split(' ')[0].toUpperCase();
}