import { KeycloakService } from 'keycloak-angular';
import { KeycloakConfig } from '@angola-workspace/shared/models';

/**
 * Factory function to initialize Keycloak
 * This is called before the Angular app starts
 */
export function initializeKeycloak(
  keycloak: KeycloakService,
  config: KeycloakConfig
) {
  return () =>
    keycloak.init({
      config: {
        url: config.url,
        realm: config.realm,
        clientId: config.clientId
      },
      initOptions: {
        // Check SSO session on startup
        onLoad: 'check-sso',
        // Use iframe for silent check-sso
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        // Enable PKCE for better security
        pkceMethod: 'S256',
        // Disable login iframe (recommended for stability)
        checkLoginIframe: false
      },
      // Enable bearer token interceptor
      enableBearerInterceptor: false, // We'll use our custom interceptor
      // Prefix for bearer token
      bearerPrefix: 'Bearer',
      // Excluded URLs from bearer token interceptor
      bearerExcludedUrls: [
        '/assets',
        '/auth/realms'
      ],
      shouldAddToken: (request) => {
        // Add token to API requests only
        const { method, url } = request;

        // Exclude token for auth endpoints
        if (url.includes('/auth/') || url.includes('/public/')) {
          return false;
        }

        return true;
      },
      shouldUpdateToken: (request) => {
        // Update token for all authenticated requests
        return !request.url.includes('/auth/');
      }
    });
}

