# Shared Libraries Deployment Strategy

## Current Implementation

In the Angola Platform Docker setup, shared libraries are managed using a **build-time inclusion** strategy:

```
┌─────────────────────────────────────────┐
│  Each Docker Image Build Process        │
│                                         │
│  1. Install dependencies               │
│  2. Build shared libraries  ←─────────┐│
│  3. Build application                 ││
│  4. Copy to nginx container           ││
│                                       ││
│  Result: Self-contained image         ││
│          with compiled libraries      ││
└───────────────────────────────────────┘│
                                         │
         Shared Libraries Bundled  ──────┘
         into Each App's Build
```

### How It Works

#### 1. **Build Stage (Dockerfile)**

Each application's Dockerfile includes:

```dockerfile
# Stage 2: Build Shared Libraries
FROM base AS build-shared
RUN npx nx run-many --target=build \
    --projects=shared-models,shared-ui-components,shared-data-access \
    --configuration=production

# Stage 3: Build Application (uses built libraries)
FROM build-shared AS build-app
RUN npx nx build ${app-name} --configuration=production
```

#### 2. **Compilation Process**

- Shared libraries are compiled to JavaScript/CSS
- Libraries are located in `dist/libs/` directory
- Applications import from these compiled libraries
- Final bundle includes library code

#### 3. **Runtime**

- Each container has complete, self-contained application
- No external dependencies on shared libraries
- Libraries are part of the JavaScript bundle served by nginx

---

## Deployment Strategies

### Strategy 1: Current Approach - Build-Time Bundling (Recommended for Small-Medium Scale)

**Pros:**
✅ Simple deployment - each app is independent
✅ No runtime dependencies
✅ Easier rollbacks - each version is self-contained
✅ Better performance - no additional network calls
✅ Works with standard static hosting

**Cons:**
❌ Larger image sizes (libraries duplicated across apps)
❌ Longer build times (libraries built multiple times)
❌ Library updates require rebuilding all apps
❌ Duplication of code across containers

**Best For:**
- Small to medium-sized deployments
- 2-5 micro-apps
- When deployment simplicity is priority
- When shared libraries change infrequently

---

### Strategy 2: Shared Library Container (Advanced)

Create a separate container that serves shared libraries as federated modules.

#### Architecture

```
┌────────────────────┐
│  Shared Libs       │
│  Container         │
│  Port: 4300        │
│                    │
│  - ui-components   │
│  - models          │
│  - data-access     │
└─────────┬──────────┘
          │
          ├─────────┐─────────┐
          ▼         ▼         ▼
      ┌───────┐ ┌───────┐ ┌───────┐
      │Shell  │ │Micro1 │ │Micro2 │
      │ App   │ │ App   │ │ App   │
      └───────┘ └───────┘ └───────┘
```

#### Implementation

**1. Create Shared Libraries Dockerfile:**

```dockerfile
# docker/shared-libs/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm ci --legacy-peer-deps

COPY libs/ ./libs/

# Build shared libraries as federated modules
RUN npx nx run-many --target=build \
    --projects=shared-models,shared-ui-components,shared-data-access \
    --configuration=production

# Serve with nginx
FROM nginx:alpine
COPY docker/nginx/shared-libs.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/libs /usr/share/nginx/html/libs

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. Update Application Dockerfiles:**

```dockerfile
# Applications skip building shared libraries
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Don't build shared libraries - will load from shared container
COPY apps/${app-path} ./apps/${app-path}
RUN npx nx build ${app-name} --configuration=production
```

**3. Update docker-compose.yml:**

```yaml
services:
  shared-libs:
    build:
      context: .
      dockerfile: docker/shared-libs/Dockerfile
    container_name: angola-shared-libs
    ports:
      - "4300:80"
    networks:
      - angola-net

  jul-portal:
    depends_on:
      - shared-libs
    environment:
      - SHARED_LIBS_URL=http://shared-libs
```

**Pros:**
✅ Shared libraries built only once
✅ Smaller individual app images
✅ Library updates don't require app rebuilds
✅ Better caching and faster builds
✅ Single source of truth for shared code

**Cons:**
❌ More complex deployment
❌ Additional container to manage
❌ Requires network calls at runtime
❌ Single point of failure
❌ More complex configuration

**Best For:**
- Large deployments (5+ micro-apps)
- Frequent shared library updates
- When library size is significant
- Teams with DevOps expertise

---

### Strategy 3: Hybrid Approach (Recommended for Production)

Combine both strategies based on library type:

#### Critical Libraries → Bundle at Build Time
- **Models/Interfaces** (small size, rarely change)
- **Core utilities** (authentication, configuration)

#### UI Components → Separate Container
- **Component library** (large, frequent updates)
- **Theme/Styling** (design system changes)

#### Implementation

**1. Split Libraries in Dockerfile:**

```dockerfile
# Build only models at build time
RUN npx nx build shared-models --configuration=production

# UI components loaded from shared container at runtime
# via federation.manifest.json
```

**2. Federation Manifest:**

```json
{
  "lpco-cnca-app": "http://localhost:4202/remoteEntry.json",
  "shared-ui-components": "http://localhost:4300/remoteEntry.json"
}
```

---

## Recommended Approach for Angola Platform

### Current Scale (2 apps): **Strategy 1 - Build-Time Bundling** ✅

**Why:**
- Simple deployment
- Fewer moving parts
- Sufficient for current scale
- Already implemented

### Growing Scale (5+ apps): **Consider Strategy 3 - Hybrid**

**When to migrate:**
- When you have 5+ micro-apps
- Shared library changes become frequent
- Build times exceed 10 minutes
- Image sizes exceed 500MB

---

## Optimization: Docker Layer Caching

Improve current build-time approach with better caching:

### Optimized Dockerfile

```dockerfile
# ========================================
# Stage 1: Dependencies Only
# ========================================
FROM node:18-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --prefer-offline

# ========================================
# Stage 2: Shared Libraries Source
# ========================================
FROM deps AS libs-source

COPY nx.json tsconfig.base.json ./
COPY libs/ ./libs/

# This layer is cached unless libs/ changes
RUN npx nx run-many --target=build \
    --projects=shared-models,shared-ui-components,shared-data-access \
    --configuration=production

# ========================================
# Stage 3: Application Build
# ========================================
FROM libs-source AS app-build

# Copy only app-specific files
COPY apps/shell-apps/jul-portal ./apps/shell-apps/jul-portal

# This layer is cached unless app files change
RUN npx nx build jul-portal --configuration=production

# ========================================
# Stage 4: Production
# ========================================
FROM nginx:alpine
COPY --from=app-build /app/dist/apps/shell-apps/jul-portal /usr/share/nginx/html
```

**Benefits:**
- Shared libraries layer cached separately
- Faster rebuilds when only app code changes
- Smaller incremental builds

---

## Library Update Workflow

### Current Approach (Build-Time Bundling)

When shared library changes:

```bash
# 1. Update library code
cd libs/shared/ui-components
# ... make changes ...

# 2. Rebuild affected applications
./scripts/docker-build.sh  # Rebuilds all apps

# 3. Test locally
docker-compose up

# 4. Deploy to production
./scripts/docker-push.sh
# Deploy updated images
```

### Automated CI/CD Pipeline

```yaml
# .github/workflows/shared-lib-update.yml
name: Shared Library Update

on:
  push:
    paths:
      - 'libs/**'

jobs:
  rebuild-apps:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [jul-portal, lpco-cnca-app]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build ${{ matrix.app }}
        run: |
          docker build \
            -f docker/*/{{ matrix.app }}/Dockerfile \
            -t $REGISTRY/angola/${{ matrix.app }}:$VERSION \
            .
      
      - name: Push to registry
        run: docker push $REGISTRY/angola/${{ matrix.app }}:$VERSION
      
      - name: Deploy
        run: |
          # Trigger deployment to staging/production
```

---

## Versioning Strategy

### Option 1: Semantic Versioning (Recommended)

```bash
# Tag images with library version
docker build -t angola/jul-portal:1.2.3-libs-2.1.0 .

# Naming convention:
# <app-version>-libs-<shared-lib-version>
```

### Option 2: Git SHA Versioning

```bash
# Tag with git commit hash
GIT_SHA=$(git rev-parse --short HEAD)
docker build -t angola/jul-portal:${GIT_SHA} .
```

### Option 3: Build Matrix

Track which app versions include which library versions:

```json
{
  "jul-portal": {
    "version": "1.2.3",
    "dependencies": {
      "shared-models": "2.1.0",
      "shared-ui-components": "3.0.1",
      "shared-data-access": "1.5.2"
    }
  }
}
```

---

## Monitoring Shared Library Usage

### Add Build Args to Track Versions

```dockerfile
ARG SHARED_LIBS_VERSION=unknown
LABEL shared-libs-version=${SHARED_LIBS_VERSION}

# Build with version
docker build --build-arg SHARED_LIBS_VERSION=2.1.0 ...
```

### Inspect Running Containers

```bash
# Check which library version is in production
docker inspect angola-shell-jul-portal | grep shared-libs-version
```

---

## Migration Path

### Phase 1: Current State (Already Implemented)
- ✅ Build-time bundling
- ✅ Simple deployment
- ✅ Self-contained images

### Phase 2: Optimization (Recommended Next Step)
- Add Docker layer caching optimization
- Implement versioning strategy
- Add CI/CD automation

### Phase 3: Scale (When Needed)
- Consider shared library container
- Implement hybrid approach
- Advanced caching strategies

---

## Troubleshooting

### Issue: Library Changes Not Reflecting

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Force rebuild without cache
docker-compose build --no-cache
```

### Issue: Large Image Sizes

**Check what's in the image:**
```bash
docker history angola/jul-portal:latest
```

**Optimize:**
- Ensure `.dockerignore` excludes unnecessary files
- Use multi-stage builds (already implemented)
- Consider separating large libraries

### Issue: Slow Build Times

**Measure:**
```bash
time docker build -f docker/shell-apps/jul-portal/Dockerfile .
```

**Optimize:**
- Use BuildKit: `DOCKER_BUILDKIT=1 docker build ...`
- Implement layer caching optimization
- Consider parallel builds

---

## Summary: Current Implementation for Angola Platform

### ✅ What We Have

1. **Each app builds its own copy of shared libraries**
   - Libraries compiled during Docker build
   - Included in final nginx image
   - Self-contained deployment

2. **Shared libraries location in images:**
   ```
   /usr/share/nginx/html/
   ├── index.html
   ├── main.*.js  (includes bundled shared libraries)
   ├── styles.*.css  (includes shared styles)
   └── assets/
   ```

3. **No separate deployment needed**
   - Libraries are part of app bundle
   - No additional containers required
   - Standard micro-frontend architecture

### 📋 Best Practices Currently Applied

✅ Multi-stage builds reduce final image size
✅ Libraries built before apps (proper dependency order)
✅ Production configuration used for optimization
✅ Separate nginx configs for different app types

### 🚀 Recommended Immediate Actions

1. **Add build optimization** (see Optimized Dockerfile above)
2. **Implement versioning strategy** (semantic versioning recommended)
3. **Set up CI/CD pipeline** (example provided above)
4. **Monitor build times** and optimize as needed

### 📊 When to Change Strategy

**Stay with current approach if:**
- You have < 5 micro-apps
- Shared libraries change monthly or less
- Build times are < 5 minutes
- Image sizes are < 300MB

**Consider migration if:**
- You have 5+ micro-apps
- Shared libraries change weekly
- Build times exceed 10 minutes
- Image sizes exceed 500MB

---

## Quick Reference

### Build All Apps with Latest Libraries
```bash
./scripts/docker-build.sh
```

### Check What's Bundled in Image
```bash
docker run --rm angola/jul-portal:latest ls -la /usr/share/nginx/html
```

### Verify Library Versions
```bash
docker inspect angola/jul-portal:latest | grep -A 10 Labels
```

### Force Rebuild After Library Changes
```bash
docker-compose build --no-cache jul-portal
```

---

**Current Status:** ✅ Production-ready with build-time bundling strategy
**Recommended Next Step:** Implement layer caching optimization and CI/CD automation
