# Native Federation Project Generator

This script automates the creation of new micro-apps and shell-apps in your Native Federation workspace.

## Usage

Run the script with npm:

```bash
npm run create:microapp
```

Or directly:

```bash
node scripts/create-microapp.js
```

On Windows, you can also use:

```bash
scripts\create-microapp.bat
```

On Linux/Mac:

```bash
chmod +x scripts/create-microapp.sh
./scripts/create-microapp.sh
```

## What it does

1. **Prompts for project details:**
   - Project type (micro-app or shell-app)
   - Project name (lowercase with hyphens)
   - **For micro-apps:** Select which shell to connect to (lists all available shells)
   - Port number (optional, with auto-detection for micro-apps)

2. **Generates the Angular application** using Nx in the correct folder:
   - `apps/micro-apps/<name>` for micro-apps
   - `apps/shell-apps/<name>` for shell-apps

3. **Configures all necessary files:**
   - ✅ Updates `project.json` with Native Federation build targets
   - ✅ Creates `federation.config.js` with proper configuration
   - ✅ Creates `federation.manifest.json` for shell-apps
   - ✅ Sets up `bootstrap.ts` and updates `main.ts`
   - ✅ Updates all `tsconfig.*.json` files with correct paths
   - ✅ Creates `package.json` in the app directory
   - ✅ Updates `tsconfig.base.json` with path mappings
   - ✅ Adds npm scripts to root `package.json`
   - ✅ Updates `styles.scss` with shared styles import
   - ✅ **For micro-apps:** Automatically adds to selected shell's `federation.manifest.json`
   - ✅ **For micro-apps:** Automatically adds route to selected shell's `app.routes.ts`

## Examples

### Create a micro-app:
```
Project type (micro-app/shell-app): micro-app
Project name: licenseManagement

📋 Available shell applications:
   1. shell (shell)
   
Select shell to connect to [1-1]: 1
   ✓ Selected: shell

Port number [default: auto-detect from 4202]: [press enter for auto-detect]
   Using port: 4203
```

### Create a shell-app:
```
Project type (micro-app/shell-app): shell-app
Project name: admin-shell
Port number [default: 4201]: 4204
```

## Automatic Integration

When creating a **micro-app**, the script will:
- ✅ Automatically add the micro-app to the selected shell's `federation.manifest.json`
- ✅ Automatically add a route in the shell's `app.routes.ts` (e.g., `/licensemanagement`)

No manual configuration needed!

## Available Scripts

After creation, you can use:

```bash
npm run serve:<project-name>    # Serve the app
npm run build:<project-name>    # Build the app
npm run test:<project-name>     # Run tests
npm run version:<project-name>  # Version the app
```

