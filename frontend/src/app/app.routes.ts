import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'register', component: Register },
  { path: '**', redirectTo: '' },
];
