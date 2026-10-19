import { HttpInterceptorFn } from '@angular/common/http';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    req.url.includes('http://localhost:8080')
  ) {
    const novaUrl = req.url.replace(
      'http://localhost:8080',
      `http://${window.location.hostname}:8080`
    );
    return next(req.clone({ url: novaUrl }));
  }
  return next(req);
};
