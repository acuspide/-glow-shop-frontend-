import { Routes } from '@angular/router';

import { Inicio } from './componentes/inicio/inicio';
import { Login } from './componentes/login/login';
import { Registro } from './componentes/registro/registro';
import { Catalogo } from './componentes/catalogo/catalogo';
import { Carrito } from './componentes/carrito/carrito';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    {
        path:'',
        component: Inicio
    },
    {
        path: 'login',
        component: Login
    },
    { path: 'registro', 
        component: Registro },
    {
        path: 'catalogo',
        component: Catalogo
    },
    // El carrito solo se puede ver con sesion iniciada.
    { path: 'carrito', 
        component: Carrito, canActivate: [authGuard] },
    { path: '**', 
        redirectTo: '' 
    },
];
