# Docker Implementation Plan - Angola Platform

## Overview

This document outlines the complete Docker implementation strategy for the Angola Platform micro-frontend architecture. Each application (shell and micro-apps) will run in separate Docker containers, enabling independent deployment, scaling, and development.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network                       │
│                  (angola-net)                        │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  Container   │  │  Container   │         │
│  │              │  │              │         │
│  │ jul-portal  │  │ lpco-cnca-app│         │
│  │   (Shell)   │  │  (Micro-App) │         │
│  │              │  │              │         │
│  │  Port: 80   │  │  Port: 80    │         │
│  │  nginx      │  │  nginx       │         │
│  └──────────────┘  └──────────────┘         │
│      ↓                  ↓                            │
│  Exposed: 4200     Exposed: 4202                    │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Phase 1: Base Configuration Files
1. Create `.dockerignore` for optimized builds
2. Create base Dockerfile template
3. Create nginx configuration templates

### Phase 2: Individual Application Dockerization
1. Shell App (jul-portal) Dockerfile
2. Micro-App (lpco-cnca-app) Dockerfile
3. Nginx configurations for each app

### Phase 3: Orchestration
1. Docker Compose for local development
2. Docker Compose for production deployment
3. Environment variable management

### Phase 4: Build & Deployment Scripts
1. Build script for all images
2. Push script for container registry
3. Deployment documentation

---

## File Structure

```
angola-platform/
├── docker/
│   ├── nginx/
│   │   ├── shell.conf               # nginx config for shell apps
│   │   └── microapp.conf            # nginx config for micro-apps
│   ├── shell-apps/
│   │   └── jul-portal/
│   │       └── Dockerfile
│   ├── micro-apps/
│   │   └── lpco-cnca-app/
│   │       └── Dockerfile
│   └── shared/
│       └── Dockerfile.template      # Base template
│
├── docker-compose.yml               # Development orchestration
├── docker-compose.prod.yml          # Production orchestration
├── .dockerignore
│
└── scripts/
    ├── docker-build.sh              # Build all images
    ├── docker-push.sh               # Push to registry
    └── docker-deploy.sh             # Deploy to environment
```

---

## Detailed Implementation

### 1. `.dockerignore` File

**Purpose:** Exclude unnecessary files from Docker context to speed up builds

**Location:** `angola-platform/.dockerignore`

**Contents:**
```
# Dependencies
node_modules
npm-debug.log
yarn-error.log

# Build outputs
dist
tmp
.angular
.nx

# IDE
.vscode
.idea
*.swp
*.swo

# Git
.git
.gitignore

# Documentation
README.md
dox

# Tests
*.spec.ts
e2e
coverage

# Environment
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile
docker-compose*.yml
.dockerignore
```

---

### 2. Multi-Stage Dockerfile Strategy

**Why Multi-Stage?**
- Smaller final image size
- Build dependencies not included in production
- Cleaner separation of concerns
- Better caching

**Stages:**
1. **Base Stage:** Install dependencies
2. **Build Stage:** Build shared libraries and application
3. **Production Stage:** Copy built files to nginx

---

### 3. Shell App Dockerfile (jul-portal)

**Location:** `docker/shell-apps/jul-portal/Dockerfile`

**Key Features:**
- Build shared libraries first
- Build shell application
- Serve with nginx
- Custom nginx configuration for SPA routing
- Environment variable injection at runtime

**Dockerfile Contents:**
```dockerfile
# ========================================
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
RUN npx nx run-many --target=build \
    --projects=shared-models,shared-ui-components,shared-data-access \
    --configuration=production

# ========================================
# Stage 3: Build Shell Application
# ========================================
FROM build-shared AS build-app

WORKDIR /app

# Build jul-portal shell app
RUN npx nx build jul-portal --configuration=production

# ========================================
# Stage 4: Production - Nginx
# ========================================
FROM nginx:alpine AS production

# Copy nginx configuration
COPY docker/nginx/shell.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build-app /app/dist/apps/shell-apps/jul-portal /usr/share/nginx/html

# Copy environment script for runtime configuration
COPY docker/shell-apps/jul-portal/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build Command:**
```bash
docker build -f docker/shell-apps/jul-portal/Dockerfile -t angola/jul-portal:latest .
```

---

### 4. Micro-App Dockerfile (lpco-cnca-app)

**Location:** `docker/micro-apps/lpco-cnca-app/Dockerfile`

**Key Differences from Shell:**
- Exposes different port internally
- Configured for CORS
- Serves `remoteEntry.json` for federation

**Dockerfile Contents:**
```dockerfile
# ========================================
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
RUN npx nx run-many --target=build \
    --projects=shared-models,shared-ui-components,shared-data-access \
    --configuration=production

# ========================================
# Stage 3: Build Micro-App
# ========================================
FROM build-shared AS build-app

WORKDIR /app

# Build lpco-cnca-app
RUN npx nx build lpco-cnca-app --configuration=production

# ========================================
# Stage 4: Production - Nginx
# ========================================
FROM nginx:alpine AS production

# Copy nginx configuration
COPY docker/nginx/microapp.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build-app /app/dist/apps/micro-apps/lpco-cnca-app /usr/share/nginx/html

# Copy environment script for runtime configuration
COPY docker/micro-apps/lpco-cnca-app/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Build Command:**
```bash
docker build -f docker/micro-apps/lpco-cnca-app/Dockerfile -t angola/lpco-cnca-app:latest .
```

---

### 5. Nginx Configuration - Shell App

**Location:** `docker/nginx/shell.conf`

**Purpose:**
- Serve Angular SPA
- Handle client-side routing
- Enable gzip compression
- Set proper cache headers
- CORS headers for federation

**Configuration:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers for federation
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type "text/plain; charset=utf-8";
        add_header Content-Length 0;
        return 204;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache federation manifest with shorter TTL
    location /federation.manifest.json {
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }

    # No cache for remoteEntry.json
    location /remoteEntry.json {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # No cache for index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Angular routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

### 6. Nginx Configuration - Micro-App

**Location:** `docker/nginx/microapp.conf`

**Key Differences:**
- More permissive CORS
- Critical for `remoteEntry.json` access
- Optimized for federation module loading

**Configuration:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers (relaxed for micro-frontend)
    add_header X-Content-Type-Options "nosniff" always;
    
    # CORS headers - CRITICAL for federation
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type "text/plain; charset=utf-8";
        add_header Content-Length 0;
        return 204;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*" always;
    }

    # CRITICAL: remoteEntry.json must be accessible with CORS
    location /remoteEntry.json {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    }

    # No cache for index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Angular routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

### 7. Environment Variable Injection Script

**Purpose:** Update federation manifest URLs at container runtime

**Location (Shell):** `docker/shell-apps/jul-portal/env.sh`

**Script:**
```bash
#!/bin/sh

# This script runs at container startup to inject environment variables
# into the federation manifest and other config files

# Default values
LPCO_CNCA_URL=${LPCO_CNCA_URL:-"http://localhost:4202"}

# Update federation manifest
FEDERATION_MANIFEST="/usr/share/nginx/html/federation.manifest.json"

if [ -f "$FEDERATION_MANIFEST" ]; then
    echo "Updating federation manifest with runtime URLs..."
    
    # Create temporary file with updated URLs
    cat > "$FEDERATION_MANIFEST.tmp" <<EOF
{
  "lpco-cnca-app": "${LPCO_CNCA_URL}/remoteEntry.json"
}
EOF
    
    # Replace original file
    mv "$FEDERATION_MANIFEST.tmp" "$FEDERATION_MANIFEST"
    
    echo "Federation manifest updated successfully"
else
    echo "Warning: Federation manifest not found at $FEDERATION_MANIFEST"
fi
```

**Location (Micro-App):** `docker/micro-apps/lpco-cnca-app/env.sh`

**Script:**
```bash
#!/bin/sh

# This script runs at container startup to inject environment variables
# Placeholder for future environment-specific configurations

echo "Micro-app environment initialized"

# Add any runtime configuration here
# Example: Update API endpoints, feature flags, etc.
```

---

### 8. Docker Compose - Development

**Location:** `angola-platform/docker-compose.yml`

**Purpose:** Local development with hot-reload (if needed) and easy setup

**Configuration:**
```yaml
version: '3.8'

services:
  # ========================================
  # Shell Application - jul-portal
  # ========================================
  jul-portal:
    build:
      context: .
      dockerfile: docker/shell-apps/jul-portal/Dockerfile
    container_name: angola-shell-jul-portal
    ports:
      - "4200:80"
    environment:
      - LPCO_CNCA_URL=http://localhost:4202
    networks:
      - angola-net
    depends_on:
      - lpco-cnca-app
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ========================================
  # Micro-App - lpco-cnca-app
  # ========================================
  lpco-cnca-app:
    build:
      context: .
      dockerfile: docker/micro-apps/lpco-cnca-app/Dockerfile
    container_name: angola-microapp-lpco-cnca
    ports:
      - "4202:80"
    environment:
      - API_URL=http://localhost:3000/api
    networks:
      - angola-net
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  angola-net:
    driver: bridge
    name: angola-platform-network
```

**Usage:**
```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

### 9. Docker Compose - Production

**Location:** `angola-platform/docker-compose.prod.yml`

**Purpose:** Production deployment with optimizations

**Key Differences:**
- Uses pre-built images from registry
- Production environment variables
- Resource limits
- Restart policies
- Logging configuration

**Configuration:**
```yaml
version: '3.8'

services:
  # ========================================
  # Shell Application - jul-portal
  # ========================================
  jul-portal:
    image: ${REGISTRY}/angola/jul-portal:${VERSION:-latest}
    container_name: angola-shell-jul-portal-prod
    ports:
      - "4200:80"
    environment:
      - LPCO_CNCA_URL=${LPCO_CNCA_URL}
      - NODE_ENV=production
    networks:
      - angola-net
    depends_on:
      - lpco-cnca-app
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ========================================
  # Micro-App - lpco-cnca-app
  # ========================================
  lpco-cnca-app:
    image: ${REGISTRY}/angola/lpco-cnca-app:${VERSION:-latest}
    container_name: angola-microapp-lpco-cnca-prod
    ports:
      - "4202:80"
    environment:
      - API_URL=${API_URL}
      - NODE_ENV=production
    networks:
      - angola-net
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  angola-net:
    driver: bridge
    name: angola-platform-network-prod
```

**Environment File (`.env.prod`):**
```env
# Registry
REGISTRY=your-registry.azurecr.io
VERSION=1.0.0

# Application URLs
LPCO_CNCA_URL=https://lpco-cnca.yourdomain.com
API_URL=https://api.yourdomain.com
```

**Usage:**
```bash
# Load production environment
source .env.prod

# Pull latest images and start
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

---

### 10. Build Script

**Location:** `scripts/docker-build.sh`

**Purpose:** Build all Docker images with proper tagging

**Script:**
```bash
#!/bin/bash

set -e  # Exit on error

# Configuration
REGISTRY=${REGISTRY:-"localhost"}
VERSION=${VERSION:-"latest"}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Angola Platform - Docker Build${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Registry: ${YELLOW}$REGISTRY${NC}"
echo -e "Version:  ${YELLOW}$VERSION${NC}"
echo -e "Build Date: ${YELLOW}$BUILD_DATE${NC}"
echo -e "Git Commit: ${YELLOW}$VCS_REF${NC}"
echo ""

# Function to build image
build_image() {
    local app_type=$1
    local app_name=$2
    local dockerfile_path=$3
    
    echo -e "${GREEN}Building $app_type: $app_name${NC}"
    
    docker build \
        -f "$dockerfile_path" \
        -t "$REGISTRY/angola/$app_name:$VERSION" \
        -t "$REGISTRY/angola/$app_name:latest" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg VERSION="$VERSION" \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully built $app_name${NC}"
    else
        echo -e "${RED}✗ Failed to build $app_name${NC}"
        exit 1
    fi
    echo ""
}

# Build Shell Apps
echo -e "${YELLOW}Building Shell Applications...${NC}"
build_image "Shell App" "jul-portal" "docker/shell-apps/jul-portal/Dockerfile"

# Build Micro-Apps
echo -e "${YELLOW}Building Micro Applications...${NC}"
build_image "Micro-App" "lpco-cnca-app" "docker/micro-apps/lpco-cnca-app/Dockerfile"

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}========================================${NC}"
docker images | grep "angola/"
echo ""
echo -e "${GREEN}All images built successfully!${NC}"
```

**Make executable:**
```bash
chmod +x scripts/docker-build.sh
```

**Usage:**
```bash
# Build with default settings
./scripts/docker-build.sh

# Build with custom registry and version
REGISTRY=myregistry.azurecr.io VERSION=1.2.3 ./scripts/docker-build.sh
```

---

### 11. Push Script

**Location:** `scripts/docker-push.sh`

**Purpose:** Push images to container registry

**Script:**
```bash
#!/bin/bash

set -e

# Configuration
REGISTRY=${REGISTRY:-"localhost"}
VERSION=${VERSION:-"latest"}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Angola Platform - Docker Push${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# List of images to push
IMAGES=(
    "angola/jul-portal"
    "angola/lpco-cnca-app"
)

# Function to push image
push_image() {
    local image=$1
    
    echo -e "${YELLOW}Pushing $image:$VERSION${NC}"
    docker push "$REGISTRY/$image:$VERSION"
    
    echo -e "${YELLOW}Pushing $image:latest${NC}"
    docker push "$REGISTRY/$image:latest"
    
    echo -e "${GREEN}✓ Successfully pushed $image${NC}"
    echo ""
}

# Login to registry
echo -e "${YELLOW}Logging in to $REGISTRY${NC}"
docker login "$REGISTRY"
echo ""

# Push all images
for image in "${IMAGES[@]}"; do
    push_image "$image"
done

echo -e "${GREEN}All images pushed successfully!${NC}"
```

**Make executable:**
```bash
chmod +x scripts/docker-push.sh
```

**Usage:**
```bash
# Azure Container Registry
REGISTRY=myregistry.azurecr.io VERSION=1.0.0 ./scripts/docker-push.sh

# Docker Hub
REGISTRY=docker.io/myorg VERSION=1.0.0 ./scripts/docker-push.sh
```

---

### 12. Windows Batch Scripts

**Build Script:** `scripts/docker-build.bat`

```batch
@echo off
setlocal

:: Configuration
if "%REGISTRY%"=="" set REGISTRY=localhost
if "%VERSION%"=="" set VERSION=latest

echo ========================================
echo Angola Platform - Docker Build
echo ========================================
echo.
echo Registry: %REGISTRY%
echo Version:  %VERSION%
echo.

:: Build Shell App
echo Building Shell Application...
docker build -f docker/shell-apps/jul-portal/Dockerfile -t %REGISTRY%/angola/jul-portal:%VERSION% -t %REGISTRY%/angola/jul-portal:latest .
if errorlevel 1 goto :error
echo.

:: Build Micro-Apps
echo Building Micro Applications...
docker build -f docker/micro-apps/lpco-cnca-app/Dockerfile -t %REGISTRY%/angola/lpco-cnca-app:%VERSION% -t %REGISTRY%/angola/lpco-cnca-app:latest .
if errorlevel 1 goto :error
echo.

echo ========================================
echo All images built successfully!
echo ========================================
docker images | findstr "angola/"
goto :end

:error
echo.
echo Build failed!
exit /b 1

:end
endlocal
```

**Push Script:** `scripts/docker-push.bat`

```batch
@echo off
setlocal

:: Configuration
if "%REGISTRY%"=="" set REGISTRY=localhost
if "%VERSION%"=="" set VERSION=latest

echo ========================================
echo Angola Platform - Docker Push
echo ========================================
echo.

:: Login to registry
echo Logging in to %REGISTRY%...
docker login %REGISTRY%
if errorlevel 1 goto :error
echo.

:: Push images
echo Pushing jul-portal...
docker push %REGISTRY%/angola/jul-portal:%VERSION%
docker push %REGISTRY%/angola/jul-portal:latest
echo.

echo Pushing lpco-cnca-app...
docker push %REGISTRY%/angola/lpco-cnca-app:%VERSION%
docker push %REGISTRY%/angola/lpco-cnca-app:latest
echo.

echo ========================================
echo All images pushed successfully!
echo ========================================
goto :end

:error
echo.
echo Push failed!
exit /b 1

:end
endlocal
```

---

## Deployment Workflows

### Local Development Workflow

```bash
# Step 1: Build images
docker-compose build

# Step 2: Start all services
docker-compose up -d

# Step 3: View logs
docker-compose logs -f

# Step 4: Access applications
# - Shell: http://localhost:4200
# - LPCO CNCA: http://localhost:4202
```

### Production Deployment Workflow

```bash
# Step 1: Build with version tag
REGISTRY=myregistry.azurecr.io VERSION=1.0.0 ./scripts/docker-build.sh

# Step 2: Push to registry
REGISTRY=myregistry.azurecr.io VERSION=1.0.0 ./scripts/docker-push.sh

# Step 3: Deploy to environment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Verify health
docker-compose -f docker-compose.prod.yml ps
```

### CI/CD Integration (GitHub Actions Example)

**Location:** `.github/workflows/docker-build-push.yml`

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main
      - develop
    tags:
      - 'v*'

env:
  REGISTRY: myregistry.azurecr.io

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Azure Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      
      - name: Extract version
        id: version
        run: |
          if [[ $GITHUB_REF == refs/tags/* ]]; then
            echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
          else
            echo "VERSION=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
          fi
      
      - name: Build and push jul-portal
        uses: docker/build-push-action@v4
        with:
          context: .
          file: docker/shell-apps/jul-portal/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/angola/jul-portal:${{ steps.version.outputs.VERSION }}
            ${{ env.REGISTRY }}/angola/jul-portal:latest
          cache-from: type=registry,ref=${{ env.REGISTRY }}/angola/jul-portal:latest
          cache-to: type=inline
      
      - name: Build and push lpco-cnca-app
        uses: docker/build-push-action@v4
        with:
          context: .
          file: docker/micro-apps/lpco-cnca-app/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/angola/lpco-cnca-app:${{ steps.version.outputs.VERSION }}
            ${{ env.REGISTRY }}/angola/lpco-cnca-app:latest
          cache-from: type=registry,ref=${{ env.REGISTRY }}/angola/lpco-cnca-app:latest
          cache-to: type=inline
```

---

## Optimization Strategies

### 1. Build Performance

**Multi-Stage Caching:**
- Separate dependency installation from build
- Cache node_modules layer
- Use BuildKit for better caching

**Parallel Builds:**
```bash
# Build images in parallel
docker-compose build --parallel
```

### 2. Image Size Reduction

**Current Strategy:**
- Alpine-based images (smaller footprint)
- Multi-stage builds (exclude build dependencies)
- Only copy necessary artifacts

**Further Optimizations:**
- Use `.dockerignore` to exclude unnecessary files
- Compress static assets
- Remove source maps in production

### 3. Security

**Best Practices:**
- Non-root user in containers
- Scan images for vulnerabilities
- Use specific version tags
- Regular base image updates

**Add to Dockerfile:**
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /usr/share/nginx/html

USER nextjs
```

---

## Monitoring & Logging

### Health Checks

Each container includes health check endpoints:
- **Endpoint:** `/health`
- **Expected Response:** 200 OK with "healthy"

### Logging Strategy

**Development:**
- Console logs visible via `docker-compose logs`

**Production:**
- JSON structured logging
- Log rotation (max 10MB, 3 files)
- Integration with logging platforms (ELK, Splunk, etc.)

### Monitoring Integration

**Prometheus Metrics:**
Add nginx prometheus exporter:
```yaml
nginx-exporter:
  image: nginx/nginx-prometheus-exporter:0.11
  command:
    - '-nginx.scrape-uri=http://jul-portal/stub_status'
  ports:
    - "9113:9113"
```

---

## Troubleshooting

### Common Issues

**1. Federation Not Working**
- **Symptom:** Micro-app not loading in shell
- **Check:** CORS headers in nginx config
- **Check:** remoteEntry.json accessibility
- **Check:** Federation manifest URLs

**2. Container Won't Start**
- **Check:** `docker-compose logs <service>`
- **Check:** Health check endpoint
- **Check:** Port conflicts

**3. Build Failures**
- **Check:** `.dockerignore` not excluding node_modules
- **Check:** Shared libraries built before app
- **Check:** Sufficient disk space

### Debug Commands

```bash
# View container logs
docker logs -f angola-shell-jul-portal

# Execute shell in container
docker exec -it angola-shell-jul-portal sh

# Inspect container
docker inspect angola-shell-jul-portal

# View nginx config
docker exec angola-shell-jul-portal cat /etc/nginx/conf.d/default.conf

# Test federation manifest
curl http://localhost:4200/federation.manifest.json

# Test remoteEntry
curl http://localhost:4202/remoteEntry.json
```

---

## Next Steps

### For New Micro-Apps

When adding a new micro-app:

1. Create Dockerfile in `docker/micro-apps/<app-name>/`
2. Create env.sh script
3. Add to docker-compose.yml
4. Add to build scripts
5. Update federation manifest
6. Document in this file

### Production Readiness Checklist

- [ ] All images tested locally
- [ ] Environment variables configured
- [ ] Secrets management implemented
- [ ] CI/CD pipeline configured
- [ ] Health checks verified
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Backup strategy defined
- [ ] Rollback procedure documented
- [ ] Security scan passed

---

## Shared Libraries Management

### How Shared Libraries Work in Docker

The Angola Platform uses shared libraries (`shared-models`, `shared-ui-components`, `shared-data-access`) across all applications. These libraries are managed using a **build-time bundling strategy**:

1. **Build Process:**
   - Stage 2 of each Dockerfile builds all shared libraries
   - Libraries are compiled to JavaScript/CSS
   - Applications import and bundle the compiled libraries
   - Final image contains self-contained application with libraries included

2. **Deployment:**
   - No separate deployment needed for libraries
   - Libraries are part of each app's bundle
   - Each container is independent and self-contained

3. **Updates:**
   - When shared libraries change, all apps must be rebuilt
   - Use CI/CD to automate rebuilding affected apps
   - Version tracking recommended (see versioning strategies)

### Detailed Guide

For comprehensive information about shared library deployment strategies, optimization, and scaling:

**See:** [Shared Libraries Deployment Guide](SHARED-LIBRARIES-DEPLOYMENT.md)

Topics covered:
- Current implementation details
- Alternative deployment strategies
- Optimization techniques (layer caching)
- Versioning strategies
- Migration paths for scaling
- CI/CD automation
- Troubleshooting

### Quick Reference

**When library changes:**
```bash
# Rebuild all affected apps
./scripts/docker-build.sh

# Or rebuild specific app
docker build -f docker/shell-apps/jul-portal/Dockerfile -t angola/jul-portal:latest .
```

**Optimized builds available:**
- See `Dockerfile.optimized` in each app directory for improved layer caching
- Reduces rebuild time when only app code changes
- Shared libraries layer cached separately

---

## Summary

This implementation provides:
- ✅ Independent Docker images for each app
- ✅ Multi-stage builds for optimization
- ✅ Shared libraries built into each app (self-contained)
- ✅ Proper nginx configuration for SPAs
- ✅ CORS configuration for federation
- ✅ Environment variable injection
- ✅ Development and production compose files
- ✅ Build and deployment scripts
- ✅ Health checks and monitoring
- ✅ Comprehensive documentation
- ✅ Optimized Dockerfiles with layer caching

**Estimated Implementation Time:** 8-12 hours

**Team Members Needed:**
- DevOps Engineer: Docker/infrastructure
- Frontend Developer: Testing federation
- QA Engineer: Validation and testing

**Related Documentation:**
- [Shared Libraries Deployment](SHARED-LIBRARIES-DEPLOYMENT.md)
- [Docker Quick Start](../docker/README.md)
- [Project Setup](PROJECT-SETUP.md)
