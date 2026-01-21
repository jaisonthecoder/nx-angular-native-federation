import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Keycloak from 'keycloak-js';

/**
 * Modern Auth Guard
 * Uses direct Keycloak instance injection
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(Keycloak);
  const router = inject(Router);

  try {
    const isLoggedIn = !!keycloak.authenticated;

    if (!isLoggedIn) {
      // Redirect to Keycloak login
      try {
        await keycloak.login({
          redirectUri: window.location.origin + state.url,
        });
      } catch (error) {
        console.error('Keycloak login error:', error);
        // If login fails, redirect to home
        router.navigate(['/']);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auth guard error:', error);
    // On any error, redirect to home/login
    router.navigate(['/']);
    return false;
  }
};

/**
 * Role-based Auth Guard Factory
 * Example: canActivate: [roleGuard(['admin', 'manager'])]
 */
export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return async (route, state) => {
    const keycloak = inject(Keycloak);
    const router = inject(Router);

    const isLoggedIn = !!keycloak.authenticated;

    if (!isLoggedIn) {
      await keycloak.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    // Check realm roles
    const hasRealmRole = requiredRoles.some(role =>
      keycloak.hasRealmRole(role)
    );

    // Check client roles
    const hasClientRole = requiredRoles.some(role => {
      const resourceAccess = keycloak.tokenParsed?.resource_access || {};
      return Object.values(resourceAccess).some((client: any) =>
        client.roles?.includes(role)
      );
    });

    const hasRole = hasRealmRole || hasClientRole;

    if (!hasRole) {
      console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};
