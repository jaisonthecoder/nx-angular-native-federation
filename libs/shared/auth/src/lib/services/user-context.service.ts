import { Injectable, inject, signal, computed } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import {
  UserContext,
  MultiContextUser,
  UserPermission,
  PermissionAction
} from '@angola-workspace/shared/models';

/**
 * Service for managing user context in multi-tenant Keycloak architecture
 * Handles extraction of user context from JWT token and context switching
 */
@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private readonly keycloakService = inject(KeycloakService);

  // Current user context signal
  private currentContextSignal = signal<UserContext | null>(null);
  private allContextsSignal = signal<UserContext[]>([]);

  // Computed signals
  currentContext = computed(() => this.currentContextSignal());
  allContexts = computed(() => this.allContextsSignal());
  hasMultipleContexts = computed(() => this.allContextsSignal().length > 1);

  /**
   * Extract user context from Keycloak token
   */
  extractUserContext(): UserContext | null {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const tokenParsed = keycloak.tokenParsed;
    if (!tokenParsed) {
      return null;
    }

    // Try to get user_context from token (custom attribute)
    const userContext = tokenParsed['user_context'] as any;
    if (userContext) {
      return this.parseUserContext(userContext);
    }

    // Fallback: Extract from groups and roles
    return this.extractContextFromGroups();
  }

  /**
   * Extract all user contexts (for multi-application users)
   */
  extractAllContexts(): UserContext[] {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const tokenParsed = keycloak.tokenParsed;
    if (!tokenParsed) {
      return [];
    }

    // Check for multiple contexts
    const contexts = tokenParsed['user_contexts'] as any[];
    if (contexts && Array.isArray(contexts)) {
      return contexts.map(ctx => this.parseUserContext(ctx));
    }

    // Single context fallback
    const singleContext = this.extractUserContext();
    return singleContext ? [singleContext] : [];
  }

  /**
   * Parse user context from token claim
   */
  private parseUserContext(contextData: any): UserContext {
    return {
      application: {
        id: contextData.application?.id || contextData.application,
        name: contextData.application?.name || contextData.application,
        clientId: contextData.application?.clientId || contextData.application
      },
      company: {
        id: contextData.company?.id || contextData.company_id || contextData.company,
        name: contextData.company?.name || contextData.company_name || contextData.company,
        keycloakGroupPath: contextData.company?.keycloakGroupPath || ''
      },
      profile: {
        id: contextData.profile?.id || contextData.profile_id || contextData.profile,
        name: contextData.profile?.name || contextData.profile_name || contextData.profile,
        keycloakGroupPath: contextData.profile?.keycloakGroupPath || ''
      },
      role: {
        id: contextData.role?.id || contextData.role_id || contextData.role,
        name: contextData.role?.name || contextData.role_name || contextData.role,
        keycloakRoleName: contextData.role?.keycloakRoleName || contextData.role,
        permissions: this.parsePermissions(contextData.permissions || contextData.role?.permissions || [])
      },
      permissions: this.parsePermissions(contextData.permissions || [])
    };
  }

  /**
   * Extract context from Keycloak groups (fallback method)
   */
  private extractContextFromGroups(): UserContext | null {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const tokenParsed = keycloak.tokenParsed;
    if (!tokenParsed) {
      return null;
    }

    const groups = (tokenParsed['groups'] as string[]) || [];
    const resourceAccess = tokenParsed['resource_access'] as Record<string, any> || {};

    // Parse group path: /app-{appId}/company-{companyId}/profile-{profileId}/role-{roleId}
    const groupPath = groups[0];
    if (!groupPath) {
      return null;
    }

    const parts = groupPath.split('/').filter(Boolean);
    if (parts.length < 4) {
      return null;
    }

    const appPart = parts[0].replace('app-', '');
    const companyPart = parts[1].replace('company-', '');
    const profilePart = parts[2].replace('profile-', '');
    const rolePart = parts[3].replace('role-', '');

    // Get client roles for permissions
    const clientId = appPart;
    const clientRoles = resourceAccess[clientId]?.roles || [];
    const permissions = this.extractPermissionsFromRoles(clientRoles);

    return {
      application: {
        id: appPart,
        name: appPart,
        clientId: clientId
      },
      company: {
        id: companyPart,
        name: companyPart,
        keycloakGroupPath: groupPath
      },
      profile: {
        id: profilePart,
        name: profilePart,
        keycloakGroupPath: groupPath
      },
      role: {
        id: rolePart,
        name: rolePart,
        keycloakRoleName: clientRoles[0] || rolePart,
        permissions
      },
      permissions
    };
  }

  /**
   * Parse permissions from array
   */
  private parsePermissions(permissions: any[]): UserPermission[] {
    if (!Array.isArray(permissions)) {
      return [];
    }

    return permissions.map(perm => {
      if (typeof perm === 'string') {
        return {
          resource: 'default',
          action: perm as PermissionAction
        };
      }
      return {
        resource: perm.resource || 'default',
        action: perm.action || perm as PermissionAction
      };
    });
  }

  /**
   * Extract permissions from role names
   */
  private extractPermissionsFromRoles(roles: string[]): UserPermission[] {
    const permissions: UserPermission[] = [];

    roles.forEach(role => {
      // Check if role contains permission pattern (e.g., "maersk.view", "maersk.edit")
      const parts = role.split('.');
      if (parts.length >= 2) {
        const action = parts[parts.length - 1];
        if (Object.values(PermissionAction).includes(action as PermissionAction)) {
          permissions.push({
            resource: parts.slice(0, -1).join('.'),
            action: action as PermissionAction
          });
        }
      }
    });

    return permissions;
  }

  /**
   * Initialize user contexts from token
   */
  initializeContexts(): void {
    const contexts = this.extractAllContexts();
    this.allContextsSignal.set(contexts);

    if (contexts.length > 0) {
      // Set first context as current, or restore from localStorage
      const savedContext = this.getSavedContext();
      const contextToUse = savedContext
        ? contexts.find(ctx => this.isContextEqual(ctx, savedContext)) || contexts[0]
        : contexts[0];

      this.setCurrentContext(contextToUse);
    }
  }

  /**
   * Set current user context
   */
  setCurrentContext(context: UserContext): void {
    this.currentContextSignal.set(context);
    this.saveContext(context);
  }

  /**
   * Switch to a different context
   */
  switchContext(context: UserContext): void {
    this.setCurrentContext(context);
    // Optionally refresh token with new context
    // This would require backend support to regenerate token with new context
  }

  /**
   * Get current context or null
   */
  getCurrentContext(): UserContext | null {
    return this.currentContextSignal();
  }

  /**
   * Check if user has permission in current context
   */
  hasPermission(action: PermissionAction, resource?: string): boolean {
    const context = this.getCurrentContext();
    if (!context) {
      return false;
    }

    return context.permissions.some(perm => {
      const actionMatch = perm.action === action;
      const resourceMatch = !resource || perm.resource === resource || perm.resource === 'default';
      return actionMatch && resourceMatch;
    });
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(actions: PermissionAction[], resource?: string): boolean {
    return actions.some(action => this.hasPermission(action, resource));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(actions: PermissionAction[], resource?: string): boolean {
    return actions.every(action => this.hasPermission(action, resource));
  }

  /**
   * Check if user belongs to specific company
   */
  belongsToCompany(companyId: string): boolean {
    const context = this.getCurrentContext();
    return context?.company.id === companyId;
  }

  /**
   * Check if user belongs to specific application
   */
  belongsToApplication(applicationId: string): boolean {
    const context = this.getCurrentContext();
    return context?.application.id === applicationId;
  }

  /**
   * Save context to localStorage
   */
  private saveContext(context: UserContext): void {
    try {
      localStorage.setItem('user_context', JSON.stringify({
        applicationId: context.application.id,
        companyId: context.company.id,
        profileId: context.profile.id,
        roleId: context.role.id
      }));
    } catch (error) {
      console.error('Failed to save context:', error);
    }
  }

  /**
   * Get saved context from localStorage
   */
  private getSavedContext(): Partial<UserContext> | null {
    try {
      const saved = localStorage.getItem('user_context');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if two contexts are equal
   */
  private isContextEqual(ctx1: UserContext, ctx2: Partial<UserContext>): boolean {
    return ctx1.application.id === ctx2.application?.id &&
           ctx1.company.id === ctx2.company?.id &&
           ctx1.profile.id === ctx2.profile?.id &&
           ctx1.role.id === ctx2.role?.id;
  }

  /**
   * Clear all contexts
   */
  clearContexts(): void {
    this.currentContextSignal.set(null);
    this.allContextsSignal.set([]);
    localStorage.removeItem('user_context');
  }
}

