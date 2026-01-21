# Native Federation Demo - Nx Workspace

Demonstrates the Usage of Native Federation with Angular Material in an **Nx Workspace**.

## 🏗️ Architecture

This project showcases **Micro-Frontend Architecture** using **Native Module Federation** with **Nx Workspace**:
- **Shell Application** - Host container (`apps/shell`)
- **Remote Application** - Dynamically loaded microfrontend (`apps/remote`)
- **Nx Workspace** - Modular monorepo architecture with independent versioning

## UI Library

- **Angular Material** - Modern Material Design components for Angular

## Trying it out

### Installation

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag ensures compatibility with all dependencies.

### Running Projects with Nx

#### Option 1: Run Shell Only

```bash
npm start            # http://localhost:4201
# or
nx serve shell       # Same as above
npm run serve:shell  # Same as above
```

#### Option 2: Run Remote Only

```bash
nx serve remote           # http://localhost:4202
# or
npm run serve:remote      # Same as above
```

#### Option 3: Run Both (Recommended)

```bash
npm run serve:both   # Runs shell (4201) + remote (4202) in parallel
# or
nx run-many --target=serve --projects=shell,remote --parallel=2
```

Then open http://localhost:4201 in your browser to see the shell loading the remote module dynamically.

#### View Dependency Graph

```bash
nx graph             # Opens interactive visualization
```

#### Build Only Affected Projects

```bash
nx affected:build    # Builds only what changed
nx affected:test     # Tests only what changed
```

## 📊 Nx Workspace Structure

```
nf-test/
├── apps/                               ← Applications
│   ├── shell/                          ← Host application (Port 4201)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── main.ts
│   │   │   └── styles.css
│   │   ├── public/
│   │   │   └── federation.manifest.json
│   │   ├── project.json               ⭐ Nx project config
│   │   ├── package.json               ⭐ Independent version
│   │   ├── federation.config.js
│   │   ├── tsconfig.app.json
│   │   └── tsconfig.spec.json
│   │
│   └── remote/                         ← Remote application (Port 4202)
│       ├── src/
│       │   ├── app/
│       │   ├── main.ts
│       │   └── styles.css
│       ├── public/
│       ├── project.json               ⭐ Nx project config
│       ├── package.json               ⭐ Independent version
│       ├── federation.config.js       (exposes ./Component)
│       ├── tsconfig.app.json
│       └── tsconfig.spec.json
│
├── libs/                               ← Shared libraries (future)
│
├── dist/                               ← Build output
│   └── apps/
│       ├── shell/
│       └── remote/
│
├── nx.json                             ⭐ Nx workspace config
├── tsconfig.base.json                  ⭐ Base TypeScript config
├── package.json                        (root dependencies)
└── global-skip-list.js
```

### Key Differences from Angular CLI:
- ✅ **Modular `project.json`** - Each app has its own config (no monolithic `angular.json`)
- ✅ **Independent versioning** - Each app has its own `package.json` with version
- ✅ **Nx caching** - Instant rebuilds after first build
- ✅ **Affected commands** - Build only what changed
- ✅ **Workspace features** - Dependency graph, better tooling

## 🔌 Port Configuration

| Application | Port | Type | URL |
|-------------|------|------|-----|
| shell | 4201 | Shell (Host) | http://localhost:4201 |
| remote | 4202 | Remote | http://localhost:4202 |

## 📋 Available Nx Scripts

```bash
# Development
npm start                  # Start shell (4201)
nx serve shell             # Start shell (4201)
nx serve remote            # Start remote (4202)
npm run serve:both         # Start both in parallel

# Build
nx build shell             # Build shell
nx build remote            # Build remote
nx run-many --target=build --all          # Build all projects
npm run build:production   # Production build of all

# Test
nx test shell              # Test shell
nx test remote             # Test remote

# Nx Features
nx graph                   # View dependency graph
nx affected:build          # Build only affected projects
nx affected:test           # Test only affected projects
nx show projects           # List all projects

# Version Management (Independent)
cd apps/shell && npm version patch    # Update shell version
cd apps/remote && npm version minor   # Update remote version
```

## 🎯 Key Features

- **Native Module Federation** - Runtime module loading
- **Angular Material** - Modern Material Design UI
- **ESBuild** - Fast build performance
- **Type-safe** - Full TypeScript support
- **Hot Module Replacement** - Fast development

## 🚀 Nx Workspace Migration (Optional)

Want 95% faster rebuilds, caching, and independent versioning? Migrate to Nx!

```bash
# Run automated migration
node migrate-to-nx-workspace.js
```

**Benefits:**
- ✅ Instant rebuilds with smart caching
- ✅ Independent versioning per app (`apps/shell/package.json`, `apps/remote/package.json`)
- ✅ Build only affected apps
- ✅ Visual dependency graph
- ✅ Modular `project.json` instead of monolithic `angular.json`

**Documentation:**
- [NX-WORKSPACE-MIGRATION-PLAN.md](./NX-WORKSPACE-MIGRATION-PLAN.md) - Complete step-by-step guide
- [NX-FOLDER-STRUCTURE-COMPARISON.md](./NX-FOLDER-STRUCTURE-COMPARISON.md) - Before/After comparison
- [migrate-to-nx-workspace.js](./migrate-to-nx-workspace.js) - Automated migration script

## 🔧 Configuration

### Federation Config

Both projects use `federation.config.js` for Native Federation setup:

**Shell (angular-material-shell):**
- Consumes remote modules
- Uses `federation.manifest.json` to discover remotes

**Remote (angular-material-app):**
```javascript
module.exports = withNativeFederation({
  name: "angular-material-app",
  exposes: {
    "./Component": "./projects/angular-material-app/src/app/app.component.ts",
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
  }
});
```

### Shared Dependencies

Angular core and Material components are shared between shell and remote:
- `@angular/core`, `@angular/common`, `@angular/router`
- `@angular/material`, `@angular/cdk`
- `rxjs`

This ensures dependencies are loaded once and shared across micro-frontends.
