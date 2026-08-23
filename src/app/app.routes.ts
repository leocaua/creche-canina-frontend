import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import path from 'node:path';
import { Login } from './pages/login/login';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },

  {
  path: '',
  redirectTo: 'login',
  pathMatch: 'full'
  }
];
