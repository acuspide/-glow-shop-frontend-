import { Routes } from '@angular/router';

import { Inicio } from './componentes/inicio/inicio';
import { Login } from './componentes/login/login';

export const routes: Routes = [
    {
        path:'',
        component: Inicio
    },
    {
        path: 'login',
        component: Login
    }
];
