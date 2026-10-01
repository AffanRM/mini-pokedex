import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pokedex/pokedex.component').then((module) => module.PokedexPage),
  },
  { path: '**', redirectTo: '' },
];
