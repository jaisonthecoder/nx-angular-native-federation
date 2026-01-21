const { withNativeFederation, shareAll } = require("@angular-architects/native-federation/config");
const path = require('path');

module.exports = withNativeFederation({
  name: "lpco-cnca-app",
  exposes: {
    "./Component": "./apps/micro-apps/lpco-cnca-app/src/app/app.ts",
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
    '@angola-workspace/shared/models': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto'
    },
    '@angola-workspace/shared/ui-components': {
      singleton: true,
      strictVersion: false,
      requiredVersion: 'auto'
    },
    '@angola-workspace/shared/data-access': {
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
    // Skip workspace shared libraries - load them directly
    p => p.startsWith('@angola-workspace/'),
    p => p.startsWith('@angola-platform/'),
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
