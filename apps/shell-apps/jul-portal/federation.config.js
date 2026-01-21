const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
const path = require('path');

module.exports = withNativeFederation({
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    }),
    // Explicitly share Keycloak as singleton across micro-frontends
    'keycloak-angular': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },
    'keycloak-js': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },
    '@angola-workspace/shared/models': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto'
    },
    '@angola-workspace/shared/auth': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto'
    }
  },
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Skip dev and build packages
    p => p.startsWith('@angular-devkit/'),
    p => p.startsWith('@angular/build'),
    p => p.startsWith('@nx/'),
    p => p.startsWith('nx'),
    p => p.startsWith('@types/'),
    p => p.startsWith('node:'),
    p => p.startsWith('karma'),
    p => p.startsWith('jasmine'),
    p => p.startsWith('esbuild'),
    p => p.startsWith('vite'),
    p => p.startsWith('typescript'),
    p => p.includes('ng-packagr'),
    p => p.includes('tslib')
  ],
  workspaceRoot: path.join(__dirname, '..', '..', '..'),
  skipSheriff: true
});
