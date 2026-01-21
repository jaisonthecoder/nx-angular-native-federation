# Angola Platform - Docker Architecture Diagram

## Overview: How Shared Libraries Are Deployed

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCKER BUILD PROCESS                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Stage 1: Install Dependencies (CACHED)                             │
│  ─────────────────────────────────────────────────────────────────  │
│  FROM node:18-alpine                                                │
│  RUN npm ci --legacy-peer-deps                                      │
│                                                                      │
│  Result: node_modules/ (350MB)                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 2: Build Shared Libraries (CACHED unless libs/ changes)      │
│  ─────────────────────────────────────────────────────────────────  │
│  COPY libs/ ./libs/                                                 │
│  RUN nx run-many --target=build                                     │
│      --projects=shared-models,shared-ui-components,shared-data-access│
│                                                                      │
│  Result: dist/libs/                                                 │
│    ├── shared-models/          (compiled TypeScript)                │
│    ├── shared-ui-components/   (compiled Angular + CSS)            │
│    └── shared-data-access/     (compiled services)                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 3: Build Application (CACHED unless app/ changes)            │
│  ─────────────────────────────────────────────────────────────────  │
│  COPY apps/shell-apps/jul-portal ./apps/shell-apps/jul-portal      │
│  RUN nx build jul-portal --configuration=production                 │
│                                                                      │
│  Process:                                                           │
│  1. Application imports from dist/libs/                             │
│  2. Webpack/esbuild bundles app + libraries together               │
│  3. Tree-shaking removes unused code                               │
│  4. Minification and optimization                                   │
│                                                                      │
│  Result: dist/apps/shell-apps/jul-portal/                          │
│    ├── index.html                                                   │
│    ├── main.[hash].js      (includes shared libraries!)            │
│    ├── styles.[hash].css   (includes shared styles!)               │
│    └── assets/                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 4: Production Image (nginx)                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  FROM nginx:alpine                                                  │
│  COPY --from=build-app /app/dist/apps/.../jul-portal /usr/share/   │
│                                                                      │
│  Final Image: ~150-200MB (compressed)                              │
│    ├── nginx                                                        │
│    ├── index.html                                                   │
│    ├── main.[hash].js      (SELF-CONTAINED with libraries!)       │
│    └── styles.[hash].css                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Runtime Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                       │
└───────────────────────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐
│Shell App │  │Micro-App │  │Micro-App │
│jul-portal│  │lpco-cnca │  │(future)  │
│          │  │          │  │          │
│Port: 4200│  │Port: 4202│  │Port: 4203│
│          │  │          │  │          │
│Contains: │  │Contains: │  │Contains: │
│ ✓ App    │  │ ✓ App    │  │ ✓ App    │
│ ✓ Libs   │  │ ✓ Libs   │  │ ✓ Libs   │
│ ✓ nginx  │  │ ✓ nginx  │  │ ✓ nginx  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     │ Federation  │              │
     │ loads ─────►│              │
     │             │              │
     │◄────────────┴──────────────┘
     │  Each app is INDEPENDENT
     │  (no shared runtime deps)
     │
     ▼
┌──────────────────────────────┐
│   User's Browser             │
│                              │
│  1. Loads shell app          │
│  2. Shell loads micro-apps   │
│  3. Everything runs          │
│     independently            │
└──────────────────────────────┘
```

---

## What's Inside Each Container?

### jul-portal (Shell) Container
```
/usr/share/nginx/html/
│
├── index.html
│
├── main.abc123.js  ──────────┐
│   └── Contains:             │  BUNDLED TOGETHER
│       ├── App code          │  at BUILD TIME
│       ├── @angular/core     │
│       ├── shared-models     │◄─ From libs/
│       ├── shared-ui-components│
│       └── shared-data-access│
│                              │
├── styles.xyz789.css ────────┤
│   └── Contains:             │
│       ├── App styles        │
│       ├── Tailwind CSS      │
│       └── shared-ui styles  │◄─ From libs/
│                              │
├── federation.manifest.json  │
│   └── Points to remote apps │
│                              │
└── assets/                   │
    └── images, fonts, etc.   │
                               │
Total Size: ~150-200MB        │
Self-contained: YES ✓         │
```

### lpco-cnca-app (Micro) Container
```
/usr/share/nginx/html/
│
├── index.html
│
├── remoteEntry.json ──────────┐
│   └── Federation metadata    │
│                               │
├── main.def456.js ────────────┤
│   └── Contains:              │  BUNDLED TOGETHER
│       ├── App code           │  at BUILD TIME
│       ├── @angular/core      │
│       ├── shared-models      │◄─ From libs/
│       ├── shared-ui-components│
│       └── shared-data-access │
│                               │
├── styles.uvw321.css ─────────┤
│   └── Contains:              │
│       ├── App styles         │
│       ├── Tailwind CSS       │
│       └── shared-ui styles   │◄─ From libs/
│                               │
└── assets/                    │
                                │
Total Size: ~150-200MB         │
Self-contained: YES ✓          │
```

---

## Key Points

### ✅ What This Means

1. **Each container is INDEPENDENT**
   - No runtime dependency on shared library container
   - Can deploy/scale/restart independently
   - Simpler architecture

2. **Shared libraries are BUNDLED at build time**
   - Not loaded from external source at runtime
   - Part of the JavaScript bundle
   - Better performance (no additional HTTP requests)

3. **Trade-off: Duplication**
   - Same library code in multiple containers
   - Larger total storage required
   - BUT: Each app works independently

---

## When Libraries Change

```
Developer Updates shared-ui-components
              │
              ▼
      CI/CD Pipeline Triggered
              │
              ├─────────────┬─────────────┐
              ▼             ▼             ▼
        Build Shell    Build Micro1   Build Micro2
        (with new     (with new      (with new
         libraries)    libraries)     libraries)
              │             │             │
              ├─────────────┴─────────────┤
              ▼
        Push to Registry
              │
              ▼
        Deploy Updated Containers
```

### Process:

1. **Update library code** in `libs/shared/ui-components/`
2. **Rebuild ALL apps** (they all use the library)
3. **Deploy updated containers**
4. **Old and new versions can coexist** (A/B testing, gradual rollout)

---

## Storage Comparison

### Current Approach (Build-Time Bundling)
```
Container 1 (jul-portal):     180 MB
  ├── App code:               50 MB
  └── Shared libs:           130 MB

Container 2 (lpco-cnca):      160 MB
  ├── App code:               30 MB
  └── Shared libs:           130 MB

Container 3 (future-app):     170 MB
  ├── App code:               40 MB
  └── Shared libs:           130 MB

TOTAL STORAGE:                510 MB
DUPLICATION:                  260 MB (libs × 2)
```

### Alternative: Shared Library Container
```
Shared Libs Container:        150 MB
  └── All shared libs

Container 1 (jul-portal):      80 MB
  └── App code only

Container 2 (lpco-cnca):       60 MB
  └── App code only

Container 3 (future-app):      70 MB
  └── App code only

TOTAL STORAGE:                360 MB
DUPLICATION:                    0 MB
COMPLEXITY:                   HIGH
RUNTIME DEPS:                 YES (requires shared libs container running)
```

---

## Recommendation for Angola Platform

### Current State: 2 Apps
**Use:** Build-time bundling (current implementation) ✅

**Pros:**
- Simple deployment
- No runtime dependencies
- Already implemented

**Cons:**
- Some duplication (acceptable for 2 apps)

### Future State: 5+ Apps
**Consider:** Shared library container or hybrid approach

**When:**
- Total duplication > 1GB
- Build times > 10 minutes
- Frequent library updates

---

## Quick Commands

### View what's in a container
```bash
docker run --rm angola/jul-portal:latest ls -lah /usr/share/nginx/html
```

### Check bundle size
```bash
docker run --rm angola/jul-portal:latest du -sh /usr/share/nginx/html/*
```

### Verify libraries are bundled
```bash
docker run --rm angola/jul-portal:latest cat /usr/share/nginx/html/main.*.js | grep -o "shared-models"
```

---

For detailed strategies and optimization techniques, see:
**[Shared Libraries Deployment Guide](SHARED-LIBRARIES-DEPLOYMENT.md)**
