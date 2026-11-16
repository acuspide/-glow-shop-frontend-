import { environment } from '../../environments/environment';

// Dirección base del backend. Sale de las variables de entorno (src/environments):
// environment.ts en desarrollo y environment.prod.ts en producción.
export const API_URL = environment.apiUrl;
