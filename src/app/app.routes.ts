import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import path from 'node:path';
import { Login } from './pages/login/login';
import { CadastroComponent } from './pages/cadastro/cadastro';
import { Home } from './pages/home/home';
import { MeusPets } from './pages/meus-pets/meus-pets';
import { MatriculasComponent } from './pages/matriculas/matriculas';
import { Rotina } from './pages/rotina/rotina';
import { PainelAdmin } from './pages/painel-admin/painel-admin';
import { EsqueciSenha } from './pages/esqueci-senha/esqueci-senha';

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
    path: 'matriculas',
    component: MatriculasComponent
  },

  {
    path: 'rotina',
    component: Rotina
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
