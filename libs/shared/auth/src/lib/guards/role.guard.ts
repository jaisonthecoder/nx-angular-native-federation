import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

/**
 * Functional guard for role-based access control (keycloak-angular v20+)
 * Usage in routes:
 * canActivate: [createRoleGuard(['admin', 'manager'])]
 */
export function createRoleGuard(allowedRoles: string[]): CanActivateFn {
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    const isLoggedIn = await keycloakService.isLoggedIn();

    if (!isLoggedIn) {
      await keycloakService.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    const keycloak = keycloakService.getKeycloakInstance();

    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some(role => {
      const hasRealmRole = keycloak.hasRealmRole(role);
      const resourceAccess = keycloak.tokenParsed?.resource_access || {};
      const hasClientRole = Object.values(resourceAccess).some((client: any) =>
        client.roles?.includes(role)
      );
      return hasRealmRole || hasClientRole;
    });

    // Development mode: Allow if user is authenticated (remove in production!)
    // Uncomment the line below to allow any authenticated user for testing
    // const devMode = true; // Set to false in production!
    const devMode = false; // Change to true for development testing

    if (!hasRole && !devMode) {
      console.warn('User does not have required roles:', allowedRoles);
      console.warn('User roles:', {
        realmRoles: keycloak.tokenParsed?.realm_access?.roles || [],
        clientRoles: keycloak.tokenParsed?.resource_access || {}
      });
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
}

/**
 * Guard that requires ALL specified roles (keycloak-angular v20+)
 */
export function createRequireAllRolesGuard(requiredRoles: string[]): CanActivateFn {
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);

    const isLoggedIn = await keycloakService.isLoggedIn();

    if (!isLoggedIn) {
      await keycloakService.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    const keycloak = keycloakService.getKeycloakInstance();

    // Check if user has all required roles
    const hasAllRoles = requiredRoles.every(role => {
      const hasRealmRole = keycloak.hasRealmRole(role);
      const resourceAccess = keycloak.tokenParsed?.resource_access || {};
      const hasClientRole = Object.values(resourceAccess).some((client: any) =>
        client.roles?.includes(role)
      );
      return hasRealmRole || hasClientRole;
    });

    if (!hasAllRoles) {
      console.warn('User does not have all required roles:', requiredRoles);
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
}

