import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('token');
  const perfil = localStorage.getItem('perfil');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const rotasAdmin = ['/painel-admin', '/agenda', '/pets-admin', '/tutores', '/rotinas-admin', '/novo-agendamento'];
  const indoParaAdmin = rotasAdmin.some(rota => state.url.includes(rota));

  if (indoParaAdmin && perfil !== 'ADMIN') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
