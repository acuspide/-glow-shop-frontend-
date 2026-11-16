# Glow Shop · Frontend

**Marketplace de productos de belleza** (maquillaje y cuidado facial, corporal y capilar).
Varias tiendas venden sus artículos en un mismo sitio; la clienta busca por tono y tipo de piel, compra, paga y sigue su pedido.

Proyecto del curso **Programación Avanzada** · Universidad del Quindío · Docente: Valentina Oviedo Sánchez
Entrega 3: aplicación en **Angular 21** con **Bootstrap 5**, conectada al backend de la Entrega 2.

- Repositorio del backend: https://github.com/acuspide/-glow-shop

---

## Integrantes

| Integrante | GitHub |
|---|---|
| Alejandro Cubides | [@acuspide](https://github.com/acuspide) |
| Yeraldin Noguera | [@Yeral30](https://github.com/Yeral30) |
| Yull Vanegas | [@yullvanegas](https://github.com/yullvanegas) |

---

## Cómo ejecutar

Hay que correr los dos proyectos al mismo tiempo, cada uno en su terminal.

### 1. Backend (Spring Boot)

Requisitos: **Java 21**. La base de datos es H2 en memoria y los datos de prueba se cargan solos al arrancar.

```bash
cd backend/ecommerce
.\gradlew.bat bootRun      # Windows
./gradlew bootRun          # Linux / macOS
```

Queda en http://localhost:8080 (Swagger en http://localhost:8080/swagger-ui.html).
El backend ya permite el origen `http://localhost:4200` (CORS).

### 2. Frontend (Angular)

Requisitos: **Node.js 20 o superior**.

```bash
cd glow-shop
npm install       # solo la primera vez
ng serve          # o: npm start
```

Abrir http://localhost:4200

> Cada vez que se reinicia el backend los datos vuelven a su estado inicial (H2 en memoria).

---

## Usuarios de prueba

Todas las contraseñas, menos la del administrador, son `Clave12345`.

| Rol | Correo | Contraseña | Qué tiene |
|---|---|---|---|
| ADMINISTRADOR | `admin@glowshop.com` | `Admin12345` | Lo crea el backend al arrancar |
| VENDEDOR | `vera@glow.com` | `Clave12345` | Tienda **Glow Natural** (ACTIVA): puede publicar |
| VENDEDOR | `lina@glow.com` | `Clave12345` | Tienda **Lina Beauty** (ACTIVA) |
| VENDEDOR | `sofia@glow.com` | `Clave12345` | Tienda **Rosa Cosméticos** (PENDIENTE): al publicar responde 422 |
| CLIENTE | `ana@correo.com` | `Clave12345` | Tiene el pedido `ped-005` esperando pago |
| CLIENTE | `carlos@correo.com` | `Clave12345` | Un pedido entregado y uno enviado |

---

## Pantallas

| Ruta | Pantalla | Quién entra |
|---|---|---|
| `/` | **Inicio**: categorías y los 3 más vendidos, salidos del backend | Todos |
| `/catalogo` | **Catálogo**: tarjetas, búsqueda, filtros por categoría, tono y tipo de piel, y paginación (Anterior · Página X de Y · Siguiente) | Todos |
| `/login` | **Iniciar sesión** | Solo sin sesión (`invitadoGuard`) |
| `/registro` | **Crear cuenta** de cliente | Solo sin sesión (`invitadoGuard`) |
| `/carrito` | **Mi carrito**: cambiar cantidades, quitar y confirmar el pedido | Con sesión (`authGuard`) |
| `/pedidos` | **Mis pedidos** y **pago simulado** | Clientes (`authGuard` + `rolGuard('CLIENTE')`) |
| `/vendedor` | **Panel del vendedor**: pedidos de la tienda y **publicar artículo** | Vendedores (`authGuard` + `rolGuard('VENDEDOR')`) |

---

## Cómo está organizado

```
glow-shop/src/app/
├── componentes/   una carpeta por pantalla o pieza (header, footer, notificaciones, catalogo, ...)
├── core/          api-config (dirección del backend), interceptor, guards y traducción de errores HTTP
├── modelos/       interfaces "espejo" de los DTOs del backend (mismos nombres de campos)
├── servicios/     un servicio por grupo de endpoints (auth, articulo, categoria, carrito, pedido, pago, reporte, vendedor, notificaciones)
└── utilidades/    funciones de apoyo para el diseño
```

- **Servicios**: los componentes no escriben direcciones de la API; se las piden al servicio.
- **Interceptor** (`core/auth-interceptor.ts`): pone `Authorization: Bearer <token>` en todas las peticiones. Si el backend responde 401, cierra la sesión, muestra un aviso y manda al login.
- **Guards** (`core/auth-guard.ts`, `core/rol-guard.ts`): son una comodidad para la persona. La seguridad real la pone el backend, que valida el token en cada petición.
- **Avisos** (`servicios/notificaciones.ts` + `componentes/notificaciones`): mensajes de éxito, error e información que desaparecen solos.
- **Errores** (`core/errores.ts`): traducen el código HTTP a un mensaje claro (400 "Revisa los datos", 404 "Lo que buscas no existe", 401 "Inicia sesión"…).

---

## Funcionalidad propia: pago simulado con confirmación automática

En **Mis pedidos**, cada pedido que espera pago tiene el botón **Pagar**. Abre un formulario reactivo donde la clienta elige el medio de pago: tarjeta de crédito, débito, PSE o Nequi.

1. Angular hace `POST /api/pedidos/{id}/pagos` con el token.
2. La pasarela simulada del backend responde al instante: **APROBADO** si el saldo del medio alcanza, o **RECHAZADO** por fondos insuficientes.
3. Si se aprueba, el pedido queda **Pagado** y el vendedor ya puede prepararlo.
4. Si se rechaza, se puede reintentar con otro medio (`POST /api/pagos/{id}/reintentos`).

Para ver un rechazo: un pedido de más de $1.000.000 pagado con Nequi o tarjeta débito.

---

## Flujo para probar de punta a punta

1. Entrar con `ana@correo.com` / `Clave12345`.
2. **Catálogo**: pasar a la página 2, buscar "labial" y agregar un producto al carrito (sale un aviso).
3. **Carrito**: confirmar el pedido.
4. **Mis pedidos**: pagar con tarjeta de crédito; se aprueba al instante.
5. Entrar con `vera@glow.com` → **Mi panel** → **Publicar artículo**: llenar el formulario y publicar (201 y aviso).
6. Error a propósito: entrar con `sofia@glow.com` y publicar; responde **422** porque su tienda está PENDIENTE.
