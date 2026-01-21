import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { SharedAuthService } from '@angola-platform/shared/data-access';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly keycloakService = inject(KeycloakService);
  private readonly sharedAuthService = inject(SharedAuthService);

  constructor() {
    // Initialize shared auth state on service creation
    this.syncAuthState();
  }

  private async syncAuthState(): Promise<void> {
    const isAuthenticated = await this.keycloakService.isLoggedIn();
    if (isAuthenticated) {
      const keycloak = this.keycloakService.getKeycloakInstance();
      this.sharedAuthService.setAuthState({
        isAuthenticated: true,
        username: keycloak.tokenParsed?.preferred_username || '',
        roles: keycloak.realmAccess?.roles || [],
        token: keycloak.token,
      });
    } else {
      this.sharedAuthService.clearAuthState();
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    return this.keycloakService.isLoggedIn();
  }

  public async login(): Promise<void> {
    await this.keycloakService.login();
    await this.syncAuthState();
  }

  public logout(): void {
    this.sharedAuthService.clearAuthState();
    this.keycloakService.logout(window.location.origin);
  }

  public async getUserProfile(): Promise<KeycloakProfile> {
    return this.keycloakService.loadUserProfile();
  }

  public getUsername(): string {
    const keycloak = this.keycloakService.getKeycloakInstance();
    return keycloak.tokenParsed?.preferred_username || '';
  }

  public getUserRoles(): string[] {
    const keycloak = this.keycloakService.getKeycloakInstance();
    return keycloak.realmAccess?.roles || [];
  }

  public hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  public getToken(): string | undefined {
    const keycloak = this.keycloakService.getKeycloakInstance();
    return keycloak.token;
  }
}
