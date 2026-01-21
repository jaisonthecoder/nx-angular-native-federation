import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';
import {
  UserRolesResponse,
  RealmRoleInfo,
  ClientRoleInfo,
  ClientRoleDetail,
  GroupInfo,
  TokenRoleInfo,
  KeycloakUserinfoResponse,
  FetchUserRolesOptions,
  ENVIRONMENT_CONFIG,
  EnvironmentConfig
} from '@angola-workspace/shared/models';

/**
 * Service for fetching comprehensive user role information from Keycloak
 *
 * This service provides multiple methods to retrieve user roles:
 * 1. From Access Token (fastest, already available)
 * 2. From Userinfo Endpoint (standard OIDC)
 * 3. From Admin API (most comprehensive, requires admin token)
 */
@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private readonly keycloakService = inject(KeycloakService);
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT_CONFIG);

  /**
   * Get comprehensive user roles information
   * Combines data from token and optionally Userinfo endpoint
   */
  getUserRoles(options: FetchUserRolesOptions = {}): Observable<UserRolesResponse> {
    const {
      includeTokenInfo = true,
      includeUserinfo = false,
      includeGroups = false,
      includePermissions = false
    } = options;

    const keycloak = this.keycloakService.getKeycloakInstance();

    // Get user ID from token
    const userId = keycloak.tokenParsed?.sub;
    const username = keycloak.tokenParsed?.['preferred_username'] || '';

    if (!userId) {
      throw new Error('User not authenticated or token missing');
    }

    // Extract roles from token (always available)
    const tokenInfo = this.extractRolesFromToken();

    // Build base response
    const baseResponse: Partial<UserRolesResponse> = {
      userId,
      username,
      email: keycloak.tokenParsed?.['email'],
      tokenInfo,
      fetchedAt: new Date().toISOString()
    };

    // Observable sources
    const observables: Observable<any>[] = [of(tokenInfo)];

    // Optionally fetch from Userinfo endpoint
    if (includeUserinfo) {
      observables.push(this.fetchUserinfo());
    }

    // Optionally fetch groups (requires admin API or userinfo)
    if (includeGroups) {
      observables.push(this.fetchUserGroups(userId).pipe(
        catchError(() => of([]))
      ));
    }

    // Combine all sources
    return combineLatest(observables).pipe(
      map(([tokenRoles, userinfo, groups]) => {
        // Merge realm roles
        const realmRoles = this.mergeRealmRoles(
          tokenRoles.realmAccess.roles,
          userinfo?.realm_access?.roles || []
        );

        // Merge client roles
        const clientRoles = this.mergeClientRoles(
          tokenRoles.resourceAccess,
          userinfo?.resource_access || {}
        );

        // Build complete response
        return {
          ...baseResponse,
          realmRoles: this.formatRealmRoles(realmRoles),
          clientRoles: this.formatClientRoles(clientRoles),
          groups: groups || [],
          effectiveRoles: this.getAllEffectiveRoles(realmRoles, clientRoles),
        } as UserRolesResponse;
      })
    );
  }

  /**
   * Extract roles directly from access token (fastest method)
   */
  extractRolesFromToken(): TokenRoleInfo {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const tokenParsed = keycloak.tokenParsed;
    if (!tokenParsed) {
      return {
        realmAccess: { roles: [] },
        resourceAccess: {}
      };
    }

    return {
      realmAccess: {
        roles: tokenParsed.realm_access?.roles || []
      },
      resourceAccess: tokenParsed.resource_access || {},
      email: tokenParsed['email'],
      emailVerified: tokenParsed['email_verified'],
      name: tokenParsed['name'],
      preferredUsername: tokenParsed['preferred_username'],
      givenName: tokenParsed['given_name'],
      familyName: tokenParsed['family_name']
    };
  }

  /**
   * Fetch user info from Keycloak Userinfo endpoint
   * Standard OIDC endpoint: /protocol/openid-connect/userinfo
   */
  fetchUserinfo(): Observable<KeycloakUserinfoResponse> {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const realm = this.getRealm();
    const userinfoUrl = `${this.getKeycloakUrl()}/realms/${realm}/protocol/openid-connect/userinfo`;

    return this.http.get<KeycloakUserinfoResponse>(userinfoUrl, {
      headers: {
        Authorization: `Bearer ${keycloak.token}`
      }
    }).pipe(
      catchError(error => {
        console.warn('Failed to fetch userinfo:', error);
        return of({} as KeycloakUserinfoResponse);
      })
    );
  }

  /**
   * Get user roles as JSON (simple method for quick access)
   */
  getUserRolesAsJson(): Observable<any> {
    return this.getUserRoles({
      includeTokenInfo: true,
      includeUserinfo: false,
      includeGroups: false
    }).pipe(
      map(response => ({
        userId: response.userId,
        username: response.username,
        email: response.email,
        realmRoles: response.realmRoles.map(r => r.name),
        clientRoles: response.clientRoles.reduce((acc, cr) => {
          acc[cr.clientId] = cr.roles.map(r => r.name);
          return acc;
        }, {} as Record<string, string[]>),
        effectiveRoles: response.effectiveRoles,
        tokenInfo: {
          realmAccess: response.tokenInfo.realmAccess,
          resourceAccess: response.tokenInfo.resourceAccess
        },
        fetchedAt: response.fetchedAt
      }))
    );
  }

  /**
   * Get comprehensive roles including groups (requires admin API or userinfo)
   */
  getUserRolesComprehensive(): Observable<UserRolesResponse> {
    const keycloak = this.keycloakService.getKeycloakInstance();
    const userId = keycloak.tokenParsed?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.getUserRoles({
      includeTokenInfo: true,
      includeUserinfo: true,
      includeGroups: true,
      includePermissions: false
    });
  }

  /**
   * Fetch user groups (requires admin API access)
   * Note: This requires admin token or backend proxy
   */
  private fetchUserGroups(userId: string): Observable<GroupInfo[]> {
    // This would require admin API access
    // For now, return empty array
    // In production, this should call your backend proxy
    return of([]);
  }

  /**
   * Merge realm roles from multiple sources
   */
  private mergeRealmRoles(...sources: (string[] | undefined)[]): string[] {
    const merged = new Set<string>();
    sources.forEach(roles => {
      if (roles) {
        roles.forEach(role => merged.add(role));
      }
    });
    return Array.from(merged);
  }

  /**
   * Merge client roles from multiple sources
   */
  private mergeClientRoles(
    ...sources: (Record<string, { roles: string[] }> | undefined)[]
  ): Record<string, string[]> {
    const merged: Record<string, Set<string>> = {};

    sources.forEach(resourceAccess => {
      if (resourceAccess) {
        Object.entries(resourceAccess).forEach(([clientId, client]) => {
          if (!merged[clientId]) {
            merged[clientId] = new Set<string>();
          }
          client.roles?.forEach(role => merged[clientId].add(role));
        });
      }
    });

    const result: Record<string, string[]> = {};
    Object.entries(merged).forEach(([clientId, roles]) => {
      result[clientId] = Array.from(roles);
    });

    return result;
  }

  /**
   * Format realm roles as RealmRoleInfo array
   */
  private formatRealmRoles(roleNames: string[]): RealmRoleInfo[] {
    return roleNames.map(name => ({
      id: name, // Use name as ID if ID not available
      name,
      composite: false, // Would need Admin API to determine
      clientRole: false,
      containerId: this.getRealm()
    }));
  }

  /**
   * Format client roles as ClientRoleInfo array
   */
  private formatClientRoles(
    clientRoles: Record<string, string[]>
  ): ClientRoleInfo[] {
    return Object.entries(clientRoles).map(([clientId, roles]) => ({
      clientId,
      roles: roles.map(roleName => ({
        id: roleName,
        name: roleName,
        composite: false,
        clientRole: true,
        containerId: clientId
      } as ClientRoleDetail))
    }));
  }

  /**
   * Get all effective roles as flat array
   */
  private getAllEffectiveRoles(
    realmRoles: string[],
    clientRoles: Record<string, string[]>
  ): string[] {
    const allRoles = [...realmRoles];
    Object.values(clientRoles).forEach(roles => {
      allRoles.push(...roles);
    });
    return Array.from(new Set(allRoles));
  }

  /**
   * Get Keycloak base URL
   */
  private getKeycloakUrl(): string {
    const keycloak = this.keycloakService.getKeycloakInstance();
    // Extract from token issuer
    const issuer = keycloak.tokenParsed?.iss;
    if (issuer) {
      return issuer.replace('/realms/' + this.getRealm(), '');
    }
    // Fallback: try to get from Keycloak instance config
    const authServerUrl = (keycloak as any).authServerUrl;
    if (authServerUrl) {
      return authServerUrl;
    }
    // Last resort fallback - use environment config
    return this.env.keycloak.url;
  }

  /**
   * Get realm name
   */
  private getRealm(): string {
    const keycloak = this.keycloakService.getKeycloakInstance();
    // Try to get realm from Keycloak instance
    if ((keycloak as any).realm) {
      return (keycloak as any).realm;
    }
    // Extract from token issuer
    const issuer = keycloak.tokenParsed?.iss;
    if (issuer) {
      const match = issuer.match(/\/realms\/([^\/]+)/);
      if (match) {
        return match[1];
      }
    }
    // Fallback - use environment config
    return this.env.keycloak.realm;
  }
}

