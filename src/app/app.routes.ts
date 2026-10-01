import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pokedex/pokedex.component').then((module) => module.PokedexPage),
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.component').then((module) => module.TeamsPage),
  },
  { path: '**', redirectTo: '' },
];
