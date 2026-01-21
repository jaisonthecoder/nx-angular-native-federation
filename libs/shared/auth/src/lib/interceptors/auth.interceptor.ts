import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

/**
 * Modern HTTP Interceptor for adding Bearer tokens
 * Add this to your app.config.ts providers:
 *
 * provideHttpClient(
 *   withInterceptors([keycloakBearerInterceptor])
 * )
 */
export const keycloakBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);

  // Exclude Keycloak admin API calls - they handle their own auth headers
  const excludedUrls = [
    '/assets',
    '/api/public',
    'localhost:9090',
    '127.0.0.1:9090',
    '/admin/realms',
    '/realms/',
    '/protocol/openid-connect'
  ];

  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  if (keycloak.authenticated && !isExcluded && keycloak.token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${keycloak.token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
