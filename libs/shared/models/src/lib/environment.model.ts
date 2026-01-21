import { InjectionToken } from '@angular/core';

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  production: boolean;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  apiUrl: string;
  keycloakRoles?: {
    superAdmin: string;
    adminUser: string;
    companyAdmin: string;
  };
}

/**
 * Injection token for environment configuration
 * Use this to inject environment config in shared libraries
 */
export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfig>(
  'Environment Configuration'
);
