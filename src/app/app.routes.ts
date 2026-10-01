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
    component: Home
  },

  {
    path:'meus-pets',
    component: MeusPets
  },

  {
  path: 'meus-pets/novo',
    component: PetDetalhesComponent
  },

  {
    path: 'meus-pets/detalhes/:id',
    component: PetDetalhesComponent
  },

  {
    path: 'matriculas',
    component: MatriculasComponent
  },

  {
    path: 'rotina',
    component: RotinaComponent
  },

  {
    path: 'painel-admin',
    component: PainelAdmin
  },

  {
  path: '',
  redirectTo: 'login',
  pathMatch: 'full'
  }
];
