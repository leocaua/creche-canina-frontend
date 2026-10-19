import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import path from 'node:path';
import { Login } from './pages/login/login';
import { CadastroComponent } from './pages/cadastro/cadastro';
import { Home } from './pages/home/home';
import { MeusPets } from './pages/meus-pets/meus-pets';
import { MatriculasComponent } from './pages/matriculas/matriculas';
import { RotinaComponent } from './pages/rotina/rotina';
import { PainelAdmin } from './pages/painel-admin/painel-admin';
import { EsqueciSenha } from './pages/esqueci-senha/esqueci-senha';
import { PetDetalhesComponent } from './pages/pet-detalhes/pet-detalhes';
import { AgendaComponent } from './pages/agenda/agenda';
import { PetsAdminComponent } from './pages/pets-admin/pets-admin';
import { TutoresComponent } from './pages/tutores/tutores';
import { NovoAgendamentoComponent } from './pages/novo-agendamento/novo-agendamento';
import { RotinasAdminComponent } from './pages/rotinas-admin/rotinas-admin';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  {
    path: 'cadastro',
    component: CadastroComponent
  },

  {
    path: 'esqueci-senha',
    component: EsqueciSenha
  },

  {
    path: 'home',
    component: Home,
    canActivate: [authGuard]
  },

  {
    path:'meus-pets',
    component: MeusPets,
    canActivate: [authGuard]
  },

  {
    path: 'meus-pets/novo',
    component: PetDetalhesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'meus-pets/detalhes/:id',
    component: PetDetalhesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'matriculas',
    component: MatriculasComponent,
    canActivate: [authGuard]
  },

  {
    path: 'rotina',
    component: RotinaComponent,
    canActivate: [authGuard]
  },

  {
    path: 'painel-admin',
    component: PainelAdmin,
    canActivate: [authGuard]
  },

  {
    path: 'agenda',
    component: AgendaComponent,
    canActivate: [authGuard]
  },

  {
    path: 'pets-admin',
    component: PetsAdminComponent,
    canActivate: [authGuard]
  },

  {
    path: 'tutores',
    component: TutoresComponent,
    canActivate: [authGuard]
  },

  {
    path: 'novo-agendamento',
    component: NovoAgendamentoComponent,
    canActivate: [authGuard]
  },

  {
    path: 'rotinas-admin',
    component: RotinasAdminComponent,
    canActivate: [authGuard]
  },

  {
  path: '',
  redirectTo: 'login',
  pathMatch: 'full'
  }
];
