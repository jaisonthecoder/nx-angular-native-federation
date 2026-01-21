import { Injectable, inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  private readonly keycloak = inject(Keycloak);

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  /**
   * Login to Keycloak
   */
  async login(redirectUri?: string): Promise<void> {
    await this.keycloak.login({
      redirectUri: redirectUri || window.location.origin
    });
  }

  /**
   * Logout from Keycloak
   */
  logout(redirectUri?: string): void {
    this.keycloak.logout({
      redirectUri: redirectUri || window.location.origin
    });
  }

  /**
   * Load user profile
   */
  async getUserProfile(): Promise<KeycloakProfile> {
    return this.keycloak.loadUserProfile();
  }

  /**
   * Get username from token
   */
  getUsername(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] || '';
  }

  /**
   * Get all user roles (realm roles)
   */
  getUserRoles(): string[] {
    return this.keycloak.realmAccess?.roles || [];
  }

  /**
   * Get client roles for a specific client
   */
  getClientRoles(clientId: string): string[] {
    return this.keycloak.tokenParsed?.resource_access?.[clientId]?.roles || [];
  }

  /**
   * Check if user has a specific realm role
   */
  hasRole(role: string): boolean {
    return this.keycloak.hasRealmRole(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Get access token
   */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /**
   * Update/refresh token
   */
  async updateToken(minValidity = 5): Promise<boolean> {
    try {
      return await this.keycloak.updateToken(minValidity);
    } catch (error) {
      console.error('Failed to refresh token', error);
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(minValidity = 0): boolean {
    return this.keycloak.isTokenExpired(minValidity);
  }

  /**
   * Get token expiration time
   */
  getTokenExpirationTime(): number | undefined {
    return this.keycloak.tokenParsed?.exp;
  }

  /**
   * Navigate to account management
   */
  accountManagement(): void {
    this.keycloak.accountManagement();
  }

  /**
   * Register new user
   */
  async register(redirectUri?: string): Promise<void> {
    await this.keycloak.register({
      redirectUri: redirectUri || window.location.origin
    });
  }

  /**
   * Clear token
   */
  clearToken(): void {
    this.keycloak.clearToken();
  }

  /**
   * Get Keycloak instance for advanced usage
   */
  getKeycloakInstance(): Keycloak {
    return this.keycloak;
  }

  /**
   * Get user info from token
   */
  getUserInfo() {
    const tokenParsed = this.keycloak.tokenParsed;
    if (!tokenParsed) {
      return {};
    }
    return {
      sub: tokenParsed.sub,
      name: tokenParsed['name'],
      preferred_username: tokenParsed['preferred_username'],
      given_name: tokenParsed['given_name'],
      family_name: tokenParsed['family_name'],
      email: tokenParsed['email'],
      email_verified: tokenParsed['email_verified']
    };
  }
}
