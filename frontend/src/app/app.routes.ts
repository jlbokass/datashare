import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { Account } from './pages/account/account';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: 'account', component: Account, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
