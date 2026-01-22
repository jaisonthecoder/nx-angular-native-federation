#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 Native Federation Project Generator\n');

  // Get project type
  const projectType = await question('Project type (micro-app/shell-app): ');
  if (!['micro-app', 'shell-app'].includes(projectType.toLowerCase())) {
    console.error('❌ Invalid project type. Must be "micro-app" or "shell-app"');
    rl.close();
    process.exit(1);
  }

  // Get framework/language
  const framework = await question('Framework (angular/react/next/vue) [default: angular]: ');
  const selectedFramework = framework.trim() || 'angular';
  const supportedFrameworks = ['angular', 'react', 'next', 'vue'];
  if (!supportedFrameworks.includes(selectedFramework.toLowerCase())) {
    console.error(`❌ Invalid framework. Supported: ${supportedFrameworks.join(', ')}`);
    rl.close();
    process.exit(1);
  }

  // Get creation method
  console.log('\n📋 Creation method:');
  console.log('   1. Create new (from scratch)');
  console.log('   2. Clone from repository');
  console.log('   3. Copy from existing project');

  const creationMethod = await question('\nSelect creation method [1-3]: ');
  let creationType = null;
  let repoUrl = null;
  let sourceProject = null;

  if (creationMethod === '2') {
    creationType = 'clone';
    repoUrl = await question('Repository URL: ');
    if (!repoUrl) {
      console.error('❌ Repository URL is required');
      rl.close();
      process.exit(1);
    }
  } else if (creationMethod === '3') {
    creationType = 'copy';
    // Show available projects to copy from
    const folderName = projectType.toLowerCase() === 'micro-app' ? 'micro-apps' : 'shell-apps';
    const sourceDir = path.join(process.cwd(), 'apps', folderName);
    const availableProjects = [];

    if (fs.existsSync(sourceDir)) {
      const dirs = fs.readdirSync(sourceDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const dir of dirs) {
        const projJsonPath = path.join(sourceDir, dir, 'project.json');
        if (fs.existsSync(projJsonPath)) {
          try {
            const projJson = JSON.parse(fs.readFileSync(projJsonPath, 'utf8'));
            if (projJson.name) {
              availableProjects.push({
                name: projJson.name,
                path: dir,
                fullPath: path.join(sourceDir, dir)
              });
            }
          } catch (e) {}
        }
      }
    }

    if (availableProjects.length > 0) {
      console.log(`\n📋 Available ${projectType} projects to copy from:`);
      availableProjects.forEach((proj, index) => {
        console.log(`   ${index + 1}. ${proj.name} (${proj.path})`);
      });

      const projectChoice = await question(`\nSelect project to copy from [1-${availableProjects.length}]: `);
      const projectIndex = parseInt(projectChoice) - 1;

      if (projectIndex >= 0 && projectIndex < availableProjects.length) {
        sourceProject = availableProjects[projectIndex];
        console.log(`   ✓ Selected: ${sourceProject.name}`);
      } else {
        console.error('❌ Invalid selection');
        rl.close();
        process.exit(1);
      }
    } else {
      console.log(`\n   ⚠ No existing ${projectType} projects found. Creating new project instead.`);
      creationType = 'new';
    }
  } else {
    creationType = 'new';
  }

  // Get project name (only if not cloning)
  let projectName;
  if (creationType === 'clone') {
    // Extract project name from repo URL or ask
    const repoNameMatch = repoUrl.match(/([^\/]+)(?:\.git)?$/);
    const suggestedName = repoNameMatch ? repoNameMatch[1].replace(/\.git$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-') : '';
    projectName = await question(`Project name [default: ${suggestedName || 'project'}]: `);
    projectName = projectName.trim() || suggestedName || 'project';
  } else {
    projectName = await question('Project name: ');
  }

  if (!projectName || !/^[a-z][a-z0-9-]*$/.test(projectName)) {
    console.error('❌ Invalid project name. Must be lowercase with hyphens only');
    rl.close();
    process.exit(1);
  }

  // Get port for shell apps
  let port = 4201;
  let selectedShell = null;

  if (projectType.toLowerCase() === 'shell-app') {
    const portInput = await question(`Port number [default: ${port}]: `);
    port = portInput ? parseInt(portInput) : port;
  } else {
    // For micro-apps, ask which shell to connect to
    const shellAppsDir = path.join(process.cwd(), 'apps/shell-apps');
    const availableShells = [];

    if (fs.existsSync(shellAppsDir)) {
      const dirs = fs.readdirSync(shellAppsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const dir of dirs) {
        const projJsonPath = path.join(shellAppsDir, dir, 'project.json');
        if (fs.existsSync(projJsonPath)) {
          try {
            const projJson = JSON.parse(fs.readFileSync(projJsonPath, 'utf8'));
            if (projJson.name) {
              availableShells.push({
                name: projJson.name,
                path: dir,
                fullPath: path.join(shellAppsDir, dir)
              });
            }
          } catch (e) {}
        }
      }
    }

    if (availableShells.length > 0) {
      console.log('\n📋 Available shell applications:');
      availableShells.forEach((shell, index) => {
        console.log(`   ${index + 1}. ${shell.name} (${shell.path})`);
      });

      const shellChoice = await question(`\nSelect shell to connect to [1-${availableShells.length}]: `);
      const shellIndex = parseInt(shellChoice) - 1;

      if (shellIndex >= 0 && shellIndex < availableShells.length) {
        selectedShell = availableShells[shellIndex];
        console.log(`   ✓ Selected: ${selectedShell.name}`);
      } else {
        console.log('   ⚠ Invalid selection, will not auto-add to any shell');
      }
    } else {
      console.log('\n   ⚠ No shell applications found. You can manually add this micro-app later.');
    }

    // For micro-apps, find next available port
    const portInput = await question(`\nPort number [default: auto-detect from 4202]: `);
    if (portInput) {
      port = parseInt(portInput);
    } else {
      // Auto-detect next port starting from 4202
      port = 4202;
      // Try to find existing ports by scanning project.json files
      const microAppsDir = path.join(process.cwd(), 'apps/micro-apps');
      if (fs.existsSync(microAppsDir)) {
        const dirs = fs.readdirSync(microAppsDir, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => d.name);
        const usedPorts = [];
        for (const dir of dirs) {
          const projJsonPath = path.join(microAppsDir, dir, 'project.json');
          if (fs.existsSync(projJsonPath)) {
            try {
              const projJson = JSON.parse(fs.readFileSync(projJsonPath, 'utf8'));
              if (projJson.targets?.['serve-original']?.options?.port) {
                usedPorts.push(projJson.targets['serve-original'].options.port);
              }
            } catch (e) {}
          }
        }
        while (usedPorts.includes(port)) {
          port++;
        }
      }
      console.log(`   Using port: ${port}`);
    }
  }

  rl.close();

  const isMicroApp = projectType.toLowerCase() === 'micro-app';
  const folderName = isMicroApp ? 'micro-apps' : 'shell-apps';
  const appPath = `apps/${folderName}/${projectName}`;
  const fullPath = path.join(process.cwd(), appPath);

  console.log(`\n📦 Creating ${projectType} "${projectName}" in ${appPath}...\n`);

  try {
    // Step 1: Generate or setup application
    if (creationType === 'clone') {
      console.log('1️⃣  Cloning from repository...');
      const clonePath = fullPath;
      // Ensure parent directory exists
      const parentDir = path.dirname(clonePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      // Clone repo
      execSync(`git clone ${repoUrl} "${clonePath}"`, { stdio: 'inherit' });
      // Remove .git directory to start fresh
      const gitDir = path.join(clonePath, '.git');
      if (fs.existsSync(gitDir)) {
        fs.rmSync(gitDir, { recursive: true, force: true });
      }
    } else if (creationType === 'copy') {
      console.log(`1️⃣  Copying from ${sourceProject.name}...`);
      const sourcePath = sourceProject.fullPath;
      const destPath = fullPath;

      // Use robocopy on Windows, cp on Unix
      if (process.platform === 'win32') {
        execSync(`robocopy "${sourcePath}" "${destPath}" /E /XD .git node_modules dist /NFL /NDL /NJH /NJS`, { stdio: 'inherit' });
      } else {
        execSync(`cp -r "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
        // Remove .git, node_modules, dist
        ['.git', 'node_modules', 'dist'].forEach(dir => {
          const dirPath = path.join(destPath, dir);
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
        });
      }

      // Update project.json with new name and paths
      const projJsonPath = path.join(destPath, 'project.json');
      if (fs.existsSync(projJsonPath)) {
        const projJson = JSON.parse(fs.readFileSync(projJsonPath, 'utf8'));
        projJson.name = projectName;
        projJson.sourceRoot = `${appPath}/src`;
        // Update all paths in project.json
        const updatePaths = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && obj[key].includes(sourceProject.path)) {
              obj[key] = obj[key].replace(new RegExp(sourceProject.path, 'g'), projectName);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              updatePaths(obj[key]);
            }
          }
        };
        updatePaths(projJson);
        fs.writeFileSync(projJsonPath, JSON.stringify(projJson, null, 2));
      }
    } else {
      // Generate new application based on framework
      console.log(`1️⃣  Generating ${selectedFramework} application...`);

      if (selectedFramework === 'angular') {
        execSync(
          `nx generate @nx/angular:application --name=${projectName} --directory=${appPath} --routing --style=scss --bundler=esbuild --ssr=false --standalone=true`,
          { stdio: 'inherit' }
        );
      } else if (selectedFramework === 'react') {
        execSync(
          `nx generate @nx/react:application --name=${projectName} --directory=${appPath} --bundler=esbuild`,
          { stdio: 'inherit' }
        );
      } else if (selectedFramework === 'next') {
        execSync(
          `nx generate @nx/next:application --name=${projectName} --directory=${appPath}`,
          { stdio: 'inherit' }
        );
      } else if (selectedFramework === 'vue') {
        execSync(
          `nx generate @nx/vue:application --name=${projectName} --directory=${appPath}`,
          { stdio: 'inherit' }
        );
      }
    }

    // Step 2: Update project.json (skip if cloned, already updated if copied)
    if (creationType !== 'clone' && creationType !== 'copy') {
      console.log('\n2️⃣  Configuring project.json...');
      const projectJsonPath = path.join(fullPath, 'project.json');
      const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));

      // Update paths
      projectJson.sourceRoot = `${appPath}/src`;
      projectJson.tags = isMicroApp ? ['type:remote', 'scope:material'] : ['type:shell', 'scope:material'];

      // Update build targets
      const projectNameCapitalized = projectName.charAt(0).toUpperCase() + projectName.slice(1);

      projectJson.targets.build = {
        executor: '@angular-architects/native-federation:build',
        outputs: ['{options.outputPath}'],
        options: {},
        configurations: {
          production: {
            target: `${projectName}:esbuild:production`
          },
          development: {
            target: `${projectName}:esbuild:development`,
            dev: true
          }
        },
        defaultConfiguration: 'production'
      };

      projectJson.targets.serve = {
        executor: '@angular-architects/native-federation:build',
        options: {
          target: `${projectName}:serve-original:development`,
          ...(isMicroApp ? {} : { buildNotifications: { enable: true } }),
          rebuildDelay: 0,
          dev: true,
          port: 0
        }
      };

      projectJson.targets.esbuild = {
        executor: '@angular/build:application',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/${appPath}`,
          index: `${appPath}/src/index.html`,
          browser: `${appPath}/src/main.ts`,
          polyfills: ['zone.js', 'es-module-shims'],
          tsConfig: `${appPath}/tsconfig.app.json`,
          assets: [{
            glob: '**/*',
            input: `${appPath}/public`
          }],
          styles: [`${appPath}/src/styles.scss`],
          scripts: [],
          ...(projectType.toLowerCase() === 'shell-app' ? {
            stylePreprocessorOptions: {
              includePaths: [`${appPath}/src`]
            }
          } : {})
        },
        configurations: {
          production: {
            budgets: [{
              type: 'initial',
              maximumWarning: '500kB',
              maximumError: '1MB'
            }],
            outputHashing: 'all'
          },
          development: {
            optimization: false,
            extractLicenses: false,
            sourceMap: true
          }
        },
        defaultConfiguration: 'production'
      };

      projectJson.targets['serve-original'] = {
        executor: '@angular/build:dev-server',
        configurations: {
          production: {
            buildTarget: `${projectName}:esbuild:production`
          },
          development: {
            buildTarget: `${projectName}:esbuild:development`
          }
        },
        defaultConfiguration: 'development',
        options: {
          port: port
        }
      };

      // Add or update test target if it doesn't exist
      if (!projectJson.targets.test) {
        projectJson.targets.test = {
          executor: '@angular/build:karma',
          options: {}
        };
      }

      projectJson.targets.test.options = {
        polyfills: ['zone.js', 'zone.js/testing'],
        tsConfig: `${appPath}/tsconfig.spec.json`,
        assets: [{
          glob: '**/*',
          input: `${appPath}/public`
        }],
        styles: [`${appPath}/src/styles.scss`],
        scripts: []
      };

      fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));
    }

    // Step 2b: Update project.json paths if cloned or copied (ensure all references are correct)
    if (creationType === 'clone' || creationType === 'copy') {
      console.log('\n2️⃣  Updating project.json references...');
      const projectJsonPath = path.join(fullPath, 'project.json');
      if (fs.existsSync(projectJsonPath)) {
        let projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
        projectJson.name = projectName;
        projectJson.sourceRoot = `${appPath}/src`;

        // Update all path references in targets
        const updateTargetPaths = (targets) => {
          for (const targetName in targets) {
            const target = targets[targetName];
            if (target.options) {
              for (const key in target.options) {
                if (typeof target.options[key] === 'string' && target.options[key].includes('apps/')) {
                  target.options[key] = target.options[key].replace(/apps\/[^\/]+\/[^\/]+/g, appPath);
                } else if (Array.isArray(target.options[key])) {
                  target.options[key] = target.options[key].map(item => {
                    if (typeof item === 'string' && item.includes('apps/')) {
                      return item.replace(/apps\/[^\/]+\/[^\/]+/g, appPath);
                    } else if (typeof item === 'object' && item.input && item.input.includes('apps/')) {
                      return { ...item, input: item.input.replace(/apps\/[^\/]+\/[^\/]+/g, appPath) };
                    }
                    return item;
                  });
                }
              }
            }
            if (target.configurations) {
              updateTargetPaths({ temp: { options: target.configurations } });
            }
          }
        };
        updateTargetPaths(projectJson.targets);
        fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));
      }
    }

    // Step 3: Update tsconfig files (only for Angular or TypeScript projects)
    if (selectedFramework === 'angular' || creationType === 'clone' || creationType === 'copy') {
      console.log('\n3️⃣  Updating TypeScript configuration...');

    // Update tsconfig.app.json
    const tsconfigAppPath = path.join(fullPath, 'tsconfig.app.json');
    if (fs.existsSync(tsconfigAppPath)) {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigAppPath, 'utf8'));
      tsconfig.extends = '../../../tsconfig.base.json';
      if (!tsconfig.compilerOptions) {
        tsconfig.compilerOptions = {};
      }
      tsconfig.compilerOptions.outDir = '../../../dist/out-tsc';
      fs.writeFileSync(tsconfigAppPath, JSON.stringify(tsconfig, null, 2));
    }

    // Create or update tsconfig.federation.json
    const tsconfigFederationPath = path.join(fullPath, 'tsconfig.federation.json');
    const federationTsconfig = {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        outDir: '../../../dist/out-tsc',
        types: ['node']
      },
      files: ['src/main.ts'],
      include: ['src/**/*.d.ts', 'src/environments/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    };
    fs.writeFileSync(tsconfigFederationPath, JSON.stringify(federationTsconfig, null, 2));

    // Create or update tsconfig.spec.json
    const tsconfigSpecPath = path.join(fullPath, 'tsconfig.spec.json');
    let specTsconfig = {
      extends: '../../../tsconfig.base.json',
      compilerOptions: {
        outDir: '../../../out-tsc/spec',
        types: ['jasmine']
      },
      include: ['src/**/*.spec.ts', 'src/**/*.d.ts']
    };
    if (fs.existsSync(tsconfigSpecPath)) {
      specTsconfig = { ...specTsconfig, ...JSON.parse(fs.readFileSync(tsconfigSpecPath, 'utf8')) };
      specTsconfig.extends = '../../../tsconfig.base.json';
      if (!specTsconfig.compilerOptions) {
        specTsconfig.compilerOptions = {};
      }
      specTsconfig.compilerOptions.outDir = '../../../out-tsc/spec';
      specTsconfig.compilerOptions.types = ['jasmine'];
    }
    fs.writeFileSync(tsconfigSpecPath, JSON.stringify(specTsconfig, null, 2));
    }

    // Step 4: Create federation.config.js for micro-apps (only for Angular)
    if (isMicroApp && selectedFramework === 'angular') {
      console.log('\n4️⃣  Creating federation.config.js...');

      // Determine which component file exists (check for standard Angular structure first)
      const appComponentPath = path.join(fullPath, 'src', 'app', 'app.component.ts');
      const appTsPath = path.join(fullPath, 'src', 'app', 'app.ts');
      let componentFile = 'app.ts'; // Default to app.ts structure (current standard)

      if (fs.existsSync(appTsPath)) {
        componentFile = 'app.ts';
      } else if (fs.existsSync(appComponentPath)) {
        componentFile = 'app.component.ts';
      }

      const federationConfig = `const { withNativeFederation, shareAll } = require("@angular-architects/native-federation/config");
const path = require('path');

module.exports = withNativeFederation({
  name: "${projectName}",
  exposes: {
    "./Component": "./${appPath}/src/app/${componentFile}",
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
`;
      fs.writeFileSync(path.join(fullPath, 'federation.config.js'), federationConfig);
    } else if (!isMicroApp && selectedFramework === 'angular') {
      // Step 4: Create federation.manifest.json for shell-apps
      console.log('\n4️⃣  Creating federation.manifest.json...');
      const publicDir = path.join(fullPath, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Get existing remotes
      const shellManifestPath = path.join(process.cwd(), 'apps/shell-apps/shell/public/federation.manifest.json');
      let existingRemotes = {};
      if (fs.existsSync(shellManifestPath)) {
        existingRemotes = JSON.parse(fs.readFileSync(shellManifestPath, 'utf8'));
      }

      // Create manifest for new shell (can be empty initially)
      const manifest = {};
      fs.writeFileSync(path.join(publicDir, 'federation.manifest.json'), JSON.stringify(manifest, null, 2));

      // Create federation.config.js for shell (without exposes)
      const federationConfig = `const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
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
`;
      fs.writeFileSync(path.join(fullPath, 'federation.config.js'), federationConfig);
    }

    // Step 4b: Setup Keycloak for shell apps (only for Angular)
    if (!isMicroApp && selectedFramework === 'angular') {
      console.log('\n4️⃣b Setting up Keycloak authentication...');

      // Create environments directory and files
      const envDir = path.join(fullPath, 'src', 'environments');
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }

      // Create environment.ts
      const environmentContent = `export const environment = {
  production: false,
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'angola-platform',
    clientId: '${projectName}',
  },
};
`;
      fs.writeFileSync(path.join(envDir, 'environment.ts'), environmentContent);

      // Create environment.prod.ts
      const environmentProdContent = `export const environment = {
  production: true,
  keycloak: {
    url: process.env['KEYCLOAK_URL'] || 'http://localhost:8080',
    realm: process.env['KEYCLOAK_REALM'] || 'angola-platform',
    clientId: process.env['KEYCLOAK_CLIENT_ID'] || '${projectName}',
  },
};
`;
      fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), environmentProdContent);

      // Create auth directory and service
      const authDir = path.join(fullPath, 'src', 'app', 'auth');
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const authServiceContent = `import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { SharedAuthService } from '@angola-workspace/shared/data-access';

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
`;
      fs.writeFileSync(path.join(authDir, 'auth.service.ts'), authServiceContent);

      // Update app.config.ts to include Keycloak
      const appConfigPath = path.join(fullPath, 'src', 'app', 'app.config.ts');
      if (fs.existsSync(appConfigPath)) {
        let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

        // Add imports if not present
        if (!appConfigContent.includes('provideKeycloak')) {
          const importSection = appConfigContent.substring(0, appConfigContent.indexOf('export const appConfig'));
          let newImports = importSection;

          if (!newImports.includes("from '@angular/common/http'")) {
            newImports += "import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';\n";
          }
          if (!newImports.includes("from 'keycloak-angular'")) {
            newImports += "import { provideKeycloak } from 'keycloak-angular';\n";
          }
          if (!newImports.includes("from '../environments/environment'")) {
            newImports += "import { environment } from '../environments/environment';\n";
          }

          appConfigContent = newImports + appConfigContent.substring(appConfigContent.indexOf('export const appConfig'));
        }

        // Add providers if not present
        if (!appConfigContent.includes('provideKeycloak(')) {
          const providersMatch = appConfigContent.match(/providers:\s*\[([^\]]*)\]/s);
          if (providersMatch) {
            let providers = providersMatch[1].trim();

            // Add HttpClient if not present
            if (!providers.includes('provideHttpClient')) {
              providers += ',\n    provideHttpClient(withInterceptorsFromDi())';
            }

            // Add Keycloak
            providers += `,\n    provideKeycloak({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false,
      },
    })`;

            appConfigContent = appConfigContent.replace(/providers:\s*\[([^\]]*)\]/s, `providers: [\n    ${providers}\n  ]`);
          }
        }

        fs.writeFileSync(appConfigPath, appConfigContent);
      } else {
        // Create app.config.ts from scratch
        const appConfigContent = `import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideKeycloak } from 'keycloak-angular';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideKeycloak({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false,
      },
    }),
  ],
};
`;
        fs.writeFileSync(appConfigPath, appConfigContent);
      }

      // Create silent-check-sso.html in public/assets
      const assetsDir = path.join(fullPath, 'public', 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const silentCheckSsoContent = `<!DOCTYPE html>
<html>
  <body>
    <script>
      parent.postMessage(location.href, location.origin);
    </script>
  </body>
</html>
`;
      fs.writeFileSync(path.join(assetsDir, 'silent-check-sso.html'), silentCheckSsoContent);

      console.log('   ✓ Created Keycloak environment files');
      console.log('   ✓ Created AuthService');
      console.log('   ✓ Updated app.config.ts with Keycloak provider');
      console.log('   ✓ Created silent-check-sso.html');

      // Create home component with login/logout UI
      const homeDir = path.join(fullPath, 'src', 'app', 'home');
      if (!fs.existsSync(homeDir)) {
        fs.mkdirSync(homeDir, { recursive: true });
      }

      const homeComponentContent = `import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="home-container">
      <div class="auth-section">
        @if (isLoggedIn) {
          <div class="user-info">
            <span>Welcome, {{ username }}</span>
            <button class="auth-btn logout-btn" (click)="logout()">Logout</button>
          </div>
        } @else {
          <button class="auth-btn login-btn" (click)="login()">Login with Keycloak</button>
        }
      </div>

      <h1>${projectName} - Shell Application</h1>
      <p>Welcome to the ${projectName}. This is your shell application for managing micro-frontends.</p>

      @if (isLoggedIn) {
        <div class="content">
          <p>You are authenticated and can access the micro applications.</p>
        </div>
      } @else {
        <div class="login-message">
          <p>Please login to access the micro applications.</p>
        </div>
      }
    </div>
  \`,
  styles: [\`
    .home-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .auth-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info span {
      color: #333;
      font-weight: 500;
    }

    .auth-btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.2s;
    }

    .login-btn {
      background: #1976d2;
      color: white;
    }

    .login-btn:hover {
      background: #1565c0;
    }

    .logout-btn {
      background: #f44336;
      color: white;
    }

    .logout-btn:hover {
      background: #d32f2f;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .login-message {
      text-align: center;
      padding: 3rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .login-message p {
      font-size: 1.1rem;
      color: #666;
    }

    .content {
      padding: 2rem;
      background: #f9f9f9;
      border-radius: 8px;
    }
  \`]
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoggedIn = false;
  username = '';

  async ngOnInit() {
    this.isLoggedIn = await this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.authService.getUsername();
    }
  }

  async login() {
    await this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
`;
      fs.writeFileSync(path.join(homeDir, 'home.component.ts'), homeComponentContent);

      // Update app.routes.ts to include home route
      const routesPath = path.join(fullPath, 'src', 'app', 'app.routes.ts');
      if (fs.existsSync(routesPath)) {
        let routesContent = fs.readFileSync(routesPath, 'utf8');

        // Add home route if not present
        if (!routesContent.includes("path: ''") && !routesContent.includes("from './home/home.component'")) {
          // Add import
          if (!routesContent.includes("import { HomeComponent }")) {
            const importIndex = routesContent.indexOf('import');
            if (importIndex !== -1) {
              routesContent = "import { HomeComponent } from './home/home.component';\n" + routesContent;
            }
          }

          // Add route
          const routesMatch = routesContent.match(/export const \w+Routes[^=]*=\s*\[/);
          if (routesMatch) {
            const insertPos = routesMatch.index + routesMatch[0].length;
            const homeRoute = "\n  {\n    path: '',\n    component: HomeComponent,\n  },";
            routesContent = routesContent.slice(0, insertPos) + homeRoute + routesContent.slice(insertPos);
          }
        }

        fs.writeFileSync(routesPath, routesContent);
      } else {
        // Create app.routes.ts from scratch
        const routesContent = `import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];
`;
        fs.writeFileSync(routesPath, routesContent);
      }

      console.log('   ✓ Created home component with Keycloak login/logout');
      console.log('   ✓ Updated routes to include home component');
    }

    // Step 5: Create bootstrap.ts and update main.ts (only for Angular)
    if (selectedFramework === 'angular') {
      console.log('\n5️⃣  Setting up bootstrap and main files...');
      const bootstrapPath = path.join(fullPath, 'src', 'bootstrap.ts');

      // Check for standard Angular structure first (app.component.ts)
      const appComponentPath = path.join(fullPath, 'src', 'app', 'app.component.ts');
      const appTsPath = path.join(fullPath, 'src', 'app', 'app.ts');
      const hasAppComponent = fs.existsSync(appComponentPath);

      let bootstrapContent;

      if (hasAppComponent) {
        bootstrapContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`;

        // Ensure AppComponent has standalone: true and default export
        let appContent = fs.readFileSync(appComponentPath, 'utf8');
        if (!appContent.includes('standalone: true') && appContent.includes('@Component({')) {
          appContent = appContent.replace('@Component({', '@Component({\n  standalone: true,');
        }
        if (!appContent.includes('export default')) {
          appContent = appContent.trim() + '\n\nexport default AppComponent;';
        }
        fs.writeFileSync(appComponentPath, appContent);
      } else if (fs.existsSync(appTsPath)) {
        // Use app.ts - need to check what it exports
        let appClassName = 'App';
        let appContent = fs.readFileSync(appTsPath, 'utf8');

        // Check if it exports App or AppComponent
        if (appContent.includes('export class App')) {
          appClassName = 'App';
        } else if (appContent.includes('export class AppComponent')) {
          appClassName = 'AppComponent';
        }

        bootstrapContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ${appClassName}${appClassName === 'App' ? ' as AppComponent' : ''} } from './app/app';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`;

        // Ensure standalone and exports
        if (!appContent.includes('standalone: true') && appContent.includes('@Component({')) {
          appContent = appContent.replace('@Component({', '@Component({\n  standalone: true,');
        }
        if (appClassName === 'App' && !appContent.includes('export { App as AppComponent }')) {
          appContent = appContent.trim() + '\n\nexport { App as AppComponent };';
        }
        if (!appContent.includes('export default')) {
          // Always export the actual class name as default, not the alias
          appContent = appContent.trim() + `\n\nexport default ${appClassName};`;
        }
        fs.writeFileSync(appTsPath, appContent);
      } else {
        // Create standard bootstrap if files don't exist
        bootstrapContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`;
      }

      fs.writeFileSync(bootstrapPath, bootstrapContent);

      const mainPath = path.join(fullPath, 'src', 'main.ts');
      if (isMicroApp) {
        const mainContent = `import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
`;
        fs.writeFileSync(mainPath, mainContent);
      } else {
        const mainContent = `import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json')
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
`;
        fs.writeFileSync(mainPath, mainContent);
      }
    }

    // Step 6: Update styles.scss (only for Angular)
    if (selectedFramework === 'angular') {
      console.log('\n6️⃣  Updating styles.scss...');
      const stylesPath = path.join(fullPath, 'src', 'styles.scss');
      if (fs.existsSync(stylesPath)) {
        let stylesContent;

        if (!isMicroApp) {
          // Shell app - include theme import
          stylesContent = `/* Import local theme */
@use 'theme/theme';

/* Import shared UI component styles */
@use '../../../../libs/shared/ui-components/src/styles.scss' as *;


`;
        } else {
          // Micro app - only import shared styles
          stylesContent = `/* Import shared Tailwind styles */
@use '../../../../libs/shared/ui-components/src/styles.scss' as *;


`;
        }
        fs.writeFileSync(stylesPath, stylesContent);

        // Create theme folder for shell apps
        if (!isMicroApp) {
          console.log('   ✓ Creating theme folder for shell app...');
          const themePath = path.join(fullPath, 'src', 'theme');
          if (!fs.existsSync(themePath)) {
            fs.mkdirSync(themePath, { recursive: true });
          }

          // Create _variables.scss
          const variablesContent = `/* ============================================
   SCSS Variables - Theme System
   These are SCSS variables that should be used in all component styles
   ============================================ */

/* ========== Brand Color System ========== */

// Primary
$color-primary-50: #f0f7fd;
$color-primary-100: #e0effc;
$color-primary-200: #c6e3f8;
$color-primary-300: #a0d1f2;
$color-primary-400: #74b9ea;
$color-primary-500: #3066be;
$color-primary-600: #2a59a6;
$color-primary-700: #244c8e;
$color-primary-800: #1e3f76;
$color-primary-900: #18325e;
$color-primary-950: #122546;

// Secondary
$color-secondary-50: #fff5f0;
$color-secondary-100: #ffeae1;
$color-secondary-200: #ffd5c3;
$color-secondary-300: #ffbba0;
$color-secondary-400: #ff9477;
$color-secondary-500: #ff6b35;
$color-secondary-600: #e6531e;
$color-secondary-700: #cc4214;
$color-secondary-800: #b3350f;
$color-secondary-900: #992d0d;
$color-secondary-950: #80260a;

// Neutral
$color-neutral-50: #fafafa;
$color-neutral-100: #f5f5f5;
$color-neutral-200: #e5e5e5;
$color-neutral-300: #d4d4d4;
$color-neutral-400: #a3a3a3;
$color-neutral-500: #737373;
$color-neutral-600: #525252;
$color-neutral-700: #404040;
$color-neutral-800: #262626;
$color-neutral-900: #171717;
$color-neutral-950: #0a0a0a;

// Status colors
$color-success: #059669;
$color-warning: #f59e0b;
$color-error: #dc2626;
$color-info: #3b82f6;

/* ========== CSS Custom Properties ========== */
:root {
  /* Colors */
  --primary: 48 102 190; /* #3066be */
  --secondary: 255 107 53; /* #ff6b35 */
  --background: 250 250 250; /* #fafafa */
  --foreground: 23 23 23; /* #171717 */
  --card: 255 255 255;
  --border: 229 229 229; /* #e5e5e5 */

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;

  /* Sidebar */
  --sidebar-width: 16rem;
  --sidebar-collapsed-width: 4rem;
}
`;
          fs.writeFileSync(path.join(themePath, '_variables.scss'), variablesContent);

          // Create _base.scss
          const baseContent = `/* ============================================
   Base Styles - Global Resets and Defaults
   ============================================ */

@use 'variables' as *;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  height: 100%;
  margin: 0;
}

body {
  font-family: var(--font-sans);
  background: rgb(var(--background));
  color: rgb(var(--foreground));
  line-height: 1.5;
}
`;
          fs.writeFileSync(path.join(themePath, '_base.scss'), baseContent);

          // Create _components.scss
          const componentsContent = `/* ============================================
   Component Styles
   ============================================ */

@use 'variables' as *;

/* Sidebar Component */
.sidebar {
  background: rgb(var(--card));
  border-right: 1px solid rgb(var(--border));
  height: 100%;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}
`;
          fs.writeFileSync(path.join(themePath, '_components.scss'), componentsContent);

          // Create theme.scss
          const themeContent = `/* ============================================
   Runtime Theme - Main Entry Point
   ============================================ */

@use 'variables';
@use 'base';
@use 'components';

@tailwind base;
@tailwind components;
@tailwind utilities;
`;
          fs.writeFileSync(path.join(themePath, 'theme.scss'), themeContent);

          console.log('   ✓ Created theme files (_variables.scss, _base.scss, _components.scss, theme.scss)');
        }
      }
    }

    // Step 7: Create package.json (if doesn't exist)
    const packageJsonPath = path.join(fullPath, 'package.json');
    if (!fs.existsSync(packageJsonPath) || creationType === 'new') {
      console.log('\n7️⃣  Creating/updating package.json...');
      const packageJson = {
        name: `@angola-workspace/${projectName}`,
        version: '1.0.0',
        description: isMicroApp
          ? 'Remote microfrontend for Native Federation'
          : 'Shell/Host application for Native Federation',
        private: true
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } else {
      console.log('\n7️⃣  Updating package.json...');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = `@angola-workspace/${projectName}`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Step 8: Update tsconfig.base.json (only for TypeScript projects)
    if (selectedFramework === 'angular' || creationType === 'clone' || creationType === 'copy') {
      console.log('\n8️⃣  Updating tsconfig.base.json...');
      const tsconfigBasePath = path.join(process.cwd(), 'tsconfig.base.json');
      const tsconfigBase = JSON.parse(fs.readFileSync(tsconfigBasePath, 'utf8'));
      const pathKey = `@angola-workspace/${projectName}/*`;
      if (!tsconfigBase.compilerOptions.paths) {
        tsconfigBase.compilerOptions.paths = {};
      }
      tsconfigBase.compilerOptions.paths[pathKey] = [`${appPath}/src/*`];
      fs.writeFileSync(tsconfigBasePath, JSON.stringify(tsconfigBase, null, 2));
    }

    // Step 9: Update package.json scripts
    console.log('\n9️⃣  Updating package.json scripts...');
    const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
    const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

    const serveScript = `serve:${projectName}`;
    const buildScript = `build:${projectName}`;
    const testScript = `test:${projectName}`;
    const versionScript = `version:${projectName}`;

    if (!rootPackageJson.scripts) {
      rootPackageJson.scripts = {};
    }

    rootPackageJson.scripts[serveScript] = `nx serve ${projectName}`;
    rootPackageJson.scripts[buildScript] = `nx build ${projectName}`;
    rootPackageJson.scripts[testScript] = `nx test ${projectName}`;
    rootPackageJson.scripts[versionScript] = `cd ${appPath} && npm version`;

    fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));

    // Step 10: Update shell's federation.manifest.json if micro-app (Angular only)
    if (isMicroApp && selectedShell && selectedFramework === 'angular') {
      console.log(`\n🔟 Updating ${selectedShell.name}'s federation.manifest.json...`);
      const manifestPath = path.join(selectedShell.fullPath, 'public', 'federation.manifest.json');

      let manifest = {};
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
          console.log('   ⚠ Could not read existing manifest, creating new one');
        }
      } else {
        // Ensure public directory exists
        const publicDir = path.join(selectedShell.fullPath, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
      }

      // Add the new micro-app
      manifest[projectName] = `http://localhost:${port}/remoteEntry.json`;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`   ✓ Added "${projectName}" to ${selectedShell.name}'s manifest`);

      // Optionally add route to app.routes.ts
      const routesPath = path.join(selectedShell.fullPath, 'src', 'app', 'app.routes.ts');
      if (fs.existsSync(routesPath)) {
        let routesContent = fs.readFileSync(routesPath, 'utf8');
        const routePath = projectName.toLowerCase();

        // Check if route already exists
        if (!routesContent.includes(`loadRemoteModule('${projectName}'`) &&
            !routesContent.includes(`path: '${routePath}'`)) {

          const routeEntry = `  {
    path: '${routePath}',
    loadComponent: () => loadRemoteModule('${projectName}', './Component').then(m => m.default || m.AppComponent || m.Component),
    // Remote app can also be protected if needed
    // canActivate: [authGuard],
    // data: { roles: [] }
  }`;

          // Find the closing bracket of routes array
          const closingBracketIndex = routesContent.lastIndexOf('];');
          if (closingBracketIndex !== -1) {
            // Get content before closing bracket
            const beforeClosing = routesContent.substring(0, closingBracketIndex).trimRight();

            // Check if we need to add a comma after the last route
            const needsComma = !beforeClosing.endsWith(',') && !beforeClosing.endsWith('{');

            // Insert the new route
            routesContent = routesContent.slice(0, closingBracketIndex) +
                          (needsComma ? ',\n' : '\n') +
                          routeEntry + '\n' +
                          routesContent.slice(closingBracketIndex);
            fs.writeFileSync(routesPath, routesContent);
            console.log(`   ✓ Added route "/${routePath}" to ${selectedShell.name}'s routes`);
          }
        } else {
          console.log(`   ℹ Route for "${projectName}" already exists or route path "${routePath}" is in use`);
        }
      }
    }

    // Step 11: Create Docker configuration files
    console.log('\n🔟 Creating Docker configuration files...');

    const dockerAppDir = path.join(process.cwd(), 'docker', folderName, projectName);
    if (!fs.existsSync(dockerAppDir)) {
      fs.mkdirSync(dockerAppDir, { recursive: true });
    }

    // Create Dockerfile
    const dockerfilePath = path.join(dockerAppDir, 'Dockerfile');
    const dockerfileContent = isMicroApp ? `# ========================================
# Stage 1: Base - Install Dependencies
# ========================================
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --prefer-offline

# Copy workspace files
COPY . .

# ========================================
# Stage 2: Build Shared Libraries
# ========================================
FROM base AS build-shared

WORKDIR /app

# Build all shared libraries
RUN npx nx run-many --target=build \\
    --projects=shared-models,shared-ui-components,shared-data-access \\
    --configuration=production

# ========================================
# Stage 3: Build Micro-App
# ========================================
FROM build-shared AS build-app

WORKDIR /app

# Build ${projectName}
RUN npx nx build ${projectName} --configuration=production

# ========================================
# Stage 4: Production - Nginx
# ========================================
FROM nginx:alpine AS production

# Copy nginx configuration
COPY docker/nginx/microapp.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build-app /app/dist/apps/${folderName}/${projectName} /usr/share/nginx/html

# Copy environment script for runtime configuration
COPY docker/${folderName}/${projectName}/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Labels
LABEL maintainer="Angola Platform Team"
LABEL app="${projectName}"
LABEL type="micro-app"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
` : `# ========================================
# Stage 1: Base - Install Dependencies
# ========================================
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --prefer-offline

# Copy workspace files
COPY . .

# ========================================
# Stage 2: Build Shared Libraries
# ========================================
FROM base AS build-shared

WORKDIR /app

# Build all shared libraries
RUN npx nx run-many --target=build \\
    --projects=shared-models,shared-ui-components,shared-data-access \\
    --configuration=production

# ========================================
# Stage 3: Build Shell Application
# ========================================
FROM build-shared AS build-app

WORKDIR /app

# Build ${projectName} shell app
RUN npx nx build ${projectName} --configuration=production

# ========================================
# Stage 4: Production - Nginx
# ========================================
FROM nginx:alpine AS production

# Copy nginx configuration
COPY docker/nginx/shell.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build-app /app/dist/apps/${folderName}/${projectName} /usr/share/nginx/html

# Copy environment script for runtime configuration
COPY docker/${folderName}/${projectName}/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Labels
LABEL maintainer="Angola Platform Team"
LABEL app="${projectName}"
LABEL type="shell-app"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log(`   ✓ Created Dockerfile: docker/${folderName}/${projectName}/Dockerfile`);

    // Create env.sh
    const envShPath = path.join(dockerAppDir, 'env.sh');
    const envShContent = isMicroApp ? `#!/bin/sh

# This script runs at container startup to inject environment variables
# Placeholder for future environment-specific configurations

echo "${projectName} micro-app environment initialized"

# Add any runtime configuration here
# Example: Update API endpoints, feature flags, etc.

# API_URL=\${API_URL:-"http://localhost:3000/api"}
# echo "API URL: $API_URL"
` : `#!/bin/sh

# This script runs at container startup to inject environment variables
# into the federation manifest and other config files

# Update federation manifest with runtime URLs
FEDERATION_MANIFEST="/usr/share/nginx/html/federation.manifest.json"

if [ -f "$FEDERATION_MANIFEST" ]; then
    echo "Updating federation manifest with runtime URLs..."

    # Read current manifest and update with environment variables
    # Add your micro-apps here as environment variables
    # Example: MICROAPP_URL=\${MICROAPP_URL:-"http://localhost:4202"}

    cat "$FEDERATION_MANIFEST"
    echo "Federation manifest ready"
else
    echo "Warning: Federation manifest not found at $FEDERATION_MANIFEST"
fi

echo "${projectName} shell app environment initialized"
`;

    fs.writeFileSync(envShPath, envShContent);
    console.log(`   ✓ Created env.sh: docker/${folderName}/${projectName}/env.sh`);

    // Update docker-compose.yml
    const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
    if (fs.existsSync(dockerComposePath)) {
      console.log(`   ℹ Docker Compose file exists. You may want to manually add the service for ${projectName}`);
      console.log(`     Template service configuration:`);
      console.log(`
  ${projectName}:
    build:
      context: .
      dockerfile: docker/${folderName}/${projectName}/Dockerfile
    container_name: angola-${isMicroApp ? 'microapp' : 'shell'}-${projectName}
    ports:
      - "${port}:80"
    environment:
      - API_URL=http://localhost:3000/api
    networks:
      - angola-net
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
`);
    }

    console.log('\n✅ Project created successfully!\n');
    console.log('📋 Next steps:');
    if (!isMicroApp && selectedFramework === 'angular') {
      console.log(`   - Install Keycloak dependencies: npm install keycloak-angular keycloak-js`);
      console.log(`   - Configure Keycloak realm and client in environment files`);
      console.log(`   - Ensure Keycloak server is running at http://localhost:8080`);
    }
    console.log(`   - Serve: npm run ${serveScript}`);
    console.log(`   - Build: npm run ${buildScript}`);
    console.log(`   - Test: npm run ${testScript}`);
    console.log(`\n🐳 Docker:`);
    console.log(`   - Build image: docker build -f docker/${folderName}/${projectName}/Dockerfile -t angola/${projectName}:latest .`);
    console.log(`   - Or use scripts: ./scripts/docker-build.sh (after adding to the script)`);
    if (isMicroApp && selectedShell) {
      console.log(`\n✅ Micro-app "${projectName}" has been automatically added to "${selectedShell.name}"`);
      console.log(`   - Manifest updated: apps/shell-apps/${selectedShell.path}/public/federation.manifest.json`);
      console.log(`   - Route added: /${projectName.toLowerCase()}`);
    } else if (isMicroApp) {
      console.log(`\n💡 Don't forget to add this remote to your shell's federation.manifest.json:`);
      console.log(`   "${projectName}": "http://localhost:${port}/remoteEntry.json"`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

