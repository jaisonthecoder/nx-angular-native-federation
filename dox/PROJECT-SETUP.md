# Angola Platform - Project Setup Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Folder Structure](#folder-structure)
5. [Package Dependencies](#package-dependencies)
6. [Development Setup](#development-setup)
7. [Building & Running Applications](#building--running-applications)
8. [Deployment](#deployment)
9. [Creating New Applications](#creating-new-applications)

---

## Project Overview

**Angola Platform** is a micro-frontend application built using Nx workspace monorepo architecture with Angular Native Federation. The platform allows multiple independent micro-applications to be developed, deployed, and loaded dynamically at runtime.

### Key Features
- **Micro-Frontend Architecture**: Independent micro-apps loaded dynamically
- **Nx Monorepo**: Centralized workspace for multiple applications and shared libraries
- **Native Federation**: Runtime module loading without build-time dependencies
- **Shared Libraries**: Reusable components, models, and services across applications

---

## Technology Stack

### Core Framework
- **Angular**: v20.1.0 (Standalone Components)
- **TypeScript**: v5.8.3
- **Nx**: v22.0.2

### Micro-Frontend Architecture
- **@angular-architects/native-federation**: v20.1.0
- **@softarc/native-federation**: v3.3.1 (Module Federation Runtime)

### UI Framework & Styling
- **Angular Material**: v20.1.0
- **Tailwind CSS**: v3.4.18
- **SCSS**: CSS preprocessing

### Build Tools
- **esbuild**: Fast JavaScript bundler
- **ng-packagr**: Library packaging tool

### Development Tools
- **ESLint**: v9.10.0
- **Prettier**: Code formatting
- **PostCSS**: CSS processing

---

## Architecture

### Micro-Frontend Pattern

The project follows the **Shell + Micro-Apps** pattern:

```
┌─────────────────────────────────────────┐
│         Shell Application               │
│         (jul-portal)                    │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Federation Manifest             │  │
│  │  - Maps micro-app names to URLs │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Runtime Loading ↓                     │
└─────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐            ┌─────────────┐
│ Micro   │            │  Micro      │
│ App 1   │            │  App 2      │
│ (LPCO-  │            │  (Future)   │
│  CNCA)  │            │             │
└─────────┘            └─────────────┘
```

### Federation Configuration

**Shell App** (`jul-portal`):
- Runs on port **4200**
- Hosts the main application shell
- Loads micro-apps dynamically via federation manifest
- Provides navigation and shared layout

**Micro-Apps** (e.g., `lpco-cnca-app`):
- Run on independent ports (e.g., **4202**)
- Expose components via `remoteEntry.json`
- Share Angular packages and workspace libraries
- Can be deployed independently

---

## Folder Structure

```
angola-platform/
├── apps/                           # Application projects
│   ├── shell-apps/                # Shell/Host applications
│   │   └── jul-portal/           # Main shell application (Port 4200)
│   │       ├── public/
│   │       │   ├── federation.manifest.json  # Micro-app registry
│   │       │   └── assets/
│   │       └── src/
│   │           ├── app/
│   │           │   ├── home/     # Home component with navigation
│   │           │   ├── app.routes.ts  # Route configuration
│   │           │   ├── app.ts    # Root component
│   │           │   └── app.html  # Shell template
│   │           ├── environments/
│   │           ├── bootstrap.ts
│   │           ├── main.ts
│   │           └── styles.scss
│   │
│   └── micro-apps/               # Micro-frontend applications
│       └── lpco-cnca-app/       # LPCO CNCA micro-app (Port 4202)
│           ├── public/
│           ├── src/
│           │   ├── app/
│           │   ├── environments/
│           │   ├── bootstrap.ts
│           │   └── main.ts
│           └── federation.config.js  # Exposes components
│
├── libs/                         # Shared libraries
│   └── shared/
│       ├── models/              # TypeScript interfaces & models
│       │   ├── src/lib/
│       │   ├── ng-package.json  # ng-packagr config
│       │   └── tsconfig.lib.json
│       │
│       ├── ui-components/       # Reusable UI components
│       │   ├── src/
│       │   │   ├── lib/
│       │   │   │   ├── button/
│       │   │   │   ├── card/
│       │   │   │   ├── data-table/
│       │   │   │   ├── form-wizard/
│       │   │   │   ├── global-menu/
│       │   │   │   ├── theme/
│       │   │   │   └── tree-view/
│       │   │   └── styles.scss  # Global styles with Tailwind
│       │   └── ng-package.json
│       │
│       └── data-access/         # Shared services & data access
│           └── src/lib/
│
├── scripts/                     # Build & generation scripts
│   ├── create-microapp.js      # CLI tool to create new apps
│   ├── create-microapp.bat     # Windows wrapper
│   └── create-microapp.sh      # Unix wrapper
│
├── dox/                        # Documentation
│   └── PROJECT-SETUP.md        # This file
│
├── docker-compose.yml          # Docker setup
├── nx.json                     # Nx workspace configuration
├── package.json                # Dependencies & scripts
├── tsconfig.base.json          # Base TypeScript config
├── tailwind.config.ts          # Tailwind CSS configuration
└── eslint.config.mjs           # ESLint configuration
```

---

## Package Dependencies

### Core Dependencies

```json
{
  "@angular/animations": "~20.1.0",
  "@angular/common": "~20.1.0",
  "@angular/compiler": "~20.1.0",
  "@angular/core": "~20.1.0",
  "@angular/forms": "~20.1.0",
  "@angular/material": "~20.1.0",
  "@angular/platform-browser": "~20.1.0",
  "@angular/router": "~20.1.0",
  "rxjs": "~7.8.0",
  "tslib": "^2.3.0",
  "zone.js": "~0.15.0"
}
```

### Native Federation

```json
{
  "@angular-architects/native-federation": "^20.1.0",
  "@softarc/native-federation": "^3.3.1"
}
```

### UI & Styling

```json
{
  "tailwindcss": "^3.4.18",
  "@tailwindcss/forms": "^0.5.9",
  "@tailwindcss/typography": "^0.5.15"
}
```

### Nx Workspace

```json
{
  "nx": "22.0.2",
  "@nx/angular": "22.0.2",
  "@nx/esbuild": "22.0.2",
  "@nx/eslint": "22.0.2",
  "@nx/workspace": "22.0.2"
}
```

### Development Tools

```json
{
  "typescript": "~5.8.3",
  "eslint": "~9.10.0",
  "prettier": "^3.0.0",
  "ng-packagr": "~20.1.0"
}
```

---

## Development Setup

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: Latest version

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd angola-platform
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   > Note: `--legacy-peer-deps` flag is used to handle peer dependency conflicts

3. **Build shared libraries**
   
   Shared libraries must be built before running applications:
   ```bash
   nx run-many --target=build --projects=shared-models,shared-ui-components,shared-data-access
   ```

---

## Building & Running Applications

### Development Workflow

#### Option 1: Serve Applications Individually

1. **Start the Shell Application**
   ```bash
   npm run serve:jul-portal
   ```
   - Accessible at: `http://localhost:4200`

2. **Start Micro-App(s)** (in separate terminal)
   ```bash
   npm run serve:lpco-cnca-app
   ```
   - Accessible at: `http://localhost:4202`

#### Option 2: Serve All Applications Concurrently

Add this script to `package.json` (if not already present):
```json
{
  "scripts": {
    "serve:all": "concurrently \"npm run serve:jul-portal\" \"npm run serve:lpco-cnca-app\" --names \"shell,lpco-cnca\" --prefix-colors \"blue,green\""
  }
}
```

Then run:
```bash
npm run serve:all
```

### Build for Production

1. **Build shared libraries**
   ```bash
   nx run-many --target=build --projects=shared-models,shared-ui-components,shared-data-access
   ```

2. **Build Shell Application**
   ```bash
   nx build jul-portal --configuration=production
   ```
   Output: `dist/apps/shell-apps/jul-portal/`

3. **Build Micro-Apps**
   ```bash
   nx build lpco-cnca-app --configuration=production
   ```
   Output: `dist/apps/micro-apps/lpco-cnca-app/`

### Important Notes

⚠️ **Always build shared libraries first** before serving or building applications

⚠️ **Do NOT add wildcard paths** to `tsconfig.base.json` - Native Federation does not support them

⚠️ **Run `nx reset`** if you encounter caching issues

---

## Deployment

### Deployment Architecture

Each application can be deployed independently:

```
Production Environment
├── CDN/Static Hosting (Shell App)
│   └── jul-portal → https://shell.example.com
│
├── CDN/Static Hosting (Micro-App 1)
│   └── lpco-cnca-app → https://lpco-cnca.example.com
│
└── CDN/Static Hosting (Micro-App 2)
    └── future-app → https://future.example.com
```

### Deployment Steps

#### 1. Update Federation Manifest

Edit `apps/shell-apps/jul-portal/public/federation.manifest.json`:

```json
{
  "lpco-cnca-app": "https://lpco-cnca.example.com/remoteEntry.json",
  "future-app": "https://future.example.com/remoteEntry.json"
}
```

#### 2. Build Applications

```bash
# Build shared libraries
nx run-many --target=build --projects=shared-models,shared-ui-components,shared-data-access

# Build shell
nx build jul-portal --configuration=production

# Build micro-apps
nx build lpco-cnca-app --configuration=production
```

#### 3. Deploy to Hosting

**Static Hosting Options:**
- Azure Static Web Apps
- AWS S3 + CloudFront
- Netlify
- Vercel
- Firebase Hosting

**Example: Azure Static Web Apps**

```bash
# Deploy shell
az staticwebapp deploy --app-name angola-shell --source dist/apps/shell-apps/jul-portal

# Deploy micro-app
az staticwebapp deploy --app-name angola-lpco-cnca --source dist/apps/micro-apps/lpco-cnca-app
```

#### 4. Configure CORS

Ensure micro-app hosts allow CORS requests from the shell app domain.

#### 5. Update Environment Variables

Update environment files for production:
- `apps/shell-apps/jul-portal/src/environments/environment.production.ts`
- `apps/micro-apps/lpco-cnca-app/src/environments/environment.production.ts`

---

## Creating New Applications

### Using the Generation Script

The project includes a CLI tool to scaffold new applications:

```bash
# Windows
scripts\create-microapp.bat

# Linux/Mac
./scripts/create-microapp.sh
```

### Interactive Prompts

1. **Choose application type:**
   - Micro-app (remote application)
   - Shell app (host application)

2. **Enter application name** (e.g., `my-new-app`)

3. **Enter port number** (e.g., `4203`)

### What Gets Created

The script will:
- Generate application structure in appropriate folder
- Configure Native Federation
- Create basic routing and components
- Update `package.json` with serve script
- Set up TypeScript configuration

### Manual Steps After Generation

1. **Add to federation manifest** (if micro-app)
   
   Edit `apps/shell-apps/jul-portal/public/federation.manifest.json`:
   ```json
   {
     "my-new-app": "http://localhost:4203/remoteEntry.json"
   }
   ```

2. **Add route in shell** (if needed)
   
   Edit `apps/shell-apps/jul-portal/src/app/app.routes.ts`:
   ```typescript
   {
     path: 'my-new-app',
     loadChildren: () =>
       loadRemoteModule('my-new-app', './Component').then(m => m.routes)
   }
   ```

3. **Build shared libraries**
   ```bash
   nx run-many --target=build --projects=shared-models,shared-ui-components,shared-data-access
   ```

4. **Start the new application**
   ```bash
   npm run serve:my-new-app
   ```

---

## Common Issues & Troubleshooting

### Issue: "Sharing mapped paths with wildcards (*) not supported"

**Solution:** Remove wildcard paths from `tsconfig.base.json`. Use explicit paths only.

### Issue: Micro-app not loading in shell

**Checklist:**
1. ✅ Micro-app is running on specified port
2. ✅ Federation manifest has correct URL
3. ✅ CORS is enabled on micro-app
4. ✅ `remoteEntry.json` is accessible
5. ✅ Shared libraries are built

### Issue: Build failures after changes

**Solution:**
```bash
nx reset
nx run-many --target=build --projects=shared-models,shared-ui-components,shared-data-access
```

### Issue: Tailwind styles not working

**Ensure:**
1. `@tailwind` directives are in `styles.scss`
2. `tailwind.config.ts` includes correct paths
3. Shared library styles include Tailwind

---

## Additional Resources

### Official Documentation
- [Nx Documentation](https://nx.dev)
- [Angular Documentation](https://angular.dev)
- [Native Federation](https://www.angulararchitects.io/en/blog/native-federation/)
- [Angular Material](https://material.angular.io)
- [Tailwind CSS](https://tailwindcss.com)

### Project Contacts
- Project Lead: [Add contact]
- Repository: [Add repository URL]
- Issue Tracker: [Add issue tracker URL]

---

**Last Updated:** January 2026  
**Version:** 1.0.0
