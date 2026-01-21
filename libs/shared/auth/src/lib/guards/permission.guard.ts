import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { PermissionService } from '../services/permission.service';
import { UserContextService } from '../services/user-context.service';
import { PermissionAction } from '@angola-workspace/shared/models';

/**
 * Permission-based guard factory
 * Usage: canActivate: [permissionGuard([PermissionAction.VIEW, PermissionAction.EDIT])]
 */
export const permissionGuard = (
  requiredPermissions: PermissionAction[],
  requireAll: boolean = false
): CanActivateFn => {
  return async (route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);
    const permissionService = inject(PermissionService);

    const isLoggedIn = await keycloakService.isLoggedIn();

    if (!isLoggedIn) {
      const keycloak = keycloakService.getKeycloakInstance();
      await keycloak.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    // Check permissions
    const hasPermission = requireAll
      ? permissionService.canAll(requiredPermissions)
      : permissionService.canAny(requiredPermissions);

    if (!hasPermission) {
      console.warn(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};

/**
 * Single permission guard
 * Usage: canActivate: [requirePermission(PermissionAction.VIEW)]
 */
export const requirePermission = (permission: PermissionAction): CanActivateFn => {
  return permissionGuard([permission], true);
};

/**
 * Company access guard - ensures user belongs to specific company
 * Usage: canActivate: [companyGuard('maersk')]
 */
export const companyGuard = (companyId: string): CanActivateFn => {
  return async (route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);
    const userContextService = inject(UserContextService);

    const isLoggedIn = await keycloakService.isLoggedIn();

    if (!isLoggedIn) {
      await keycloakService.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    if (!userContextService.belongsToCompany(companyId)) {
      console.warn(`Access denied. User does not belong to company: ${companyId}`);
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};

/**
 * Application access guard - ensures user belongs to specific application
 * Usage: canActivate: [applicationGuard('shipping-app')]
 */
export const applicationGuard = (applicationId: string): CanActivateFn => {
  return async (route, state) => {
    const keycloakService = inject(KeycloakService);
    const router = inject(Router);
    const userContextService = inject(UserContextService);

    const isLoggedIn = await keycloakService.isLoggedIn();

    if (!isLoggedIn) {
      await keycloakService.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    if (!userContextService.belongsToApplication(applicationId)) {
      console.warn(`Access denied. User does not belong to application: ${applicationId}`);
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};

