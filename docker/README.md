# Docker Quick Start Guide

This guide provides quick commands to build, run, and deploy the Angola Platform using Docker.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Build All Images

**Windows:**
```cmd
scripts\docker-build.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/docker-build.sh
./scripts/docker-build.sh
```

### 2. Run Locally with Docker Compose

```bash
docker-compose up --build
```

**Access Applications:**
- Shell App (jul-portal): http://localhost:4200
- Micro-App (lpco-cnca-app): http://localhost:4202

### 3. Stop Services

```bash
docker-compose down
```

## Production Deployment

### 1. Set Environment Variables

Copy and edit the example environment file:

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod` with your production values.

### 2. Build with Version Tag

**Windows:**
```cmd
set REGISTRY=your-registry.azurecr.io
set VERSION=1.0.0
scripts\docker-build.bat
```

**Linux/Mac:**
```bash
export REGISTRY=your-registry.azurecr.io
export VERSION=1.0.0
./scripts/docker-build.sh
```

### 3. Push to Registry

**Windows:**
```cmd
scripts\docker-push.bat
```

**Linux/Mac:**
```bash
./scripts/docker-push.sh
```

### 4. Deploy to Production

```bash
source .env.prod
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Individual Commands

### Build Single App

**Shell App:**
```bash
docker build -f docker/shell-apps/jul-portal/Dockerfile -t angola/jul-portal:latest .
```

**Micro-App:**
```bash
docker build -f docker/micro-apps/lpco-cnca-app/Dockerfile -t angola/lpco-cnca-app:latest .
```

### Run Single Container

**Shell App:**
```bash
docker run -d -p 4200:80 --name jul-portal angola/jul-portal:latest
```

**Micro-App:**
```bash
docker run -d -p 4202:80 --name lpco-cnca-app angola/lpco-cnca-app:latest
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f jul-portal
docker-compose logs -f lpco-cnca-app
```

### Health Checks

```bash
# Check shell app health
curl http://localhost:4200/health

# Check micro-app health
curl http://localhost:4202/health

# Check federation manifest
curl http://localhost:4200/federation.manifest.json

# Check remoteEntry
curl http://localhost:4202/remoteEntry.json
```

## Troubleshooting

### Container Won't Start

```bash
# View logs
docker logs angola-shell-jul-portal

# Check health status
docker inspect --format='{{.State.Health.Status}}' angola-shell-jul-portal
```

### Clear Everything and Rebuild

```bash
# Stop and remove containers
docker-compose down -v

# Remove all angola images
docker rmi $(docker images -q 'angola/*')

# Rebuild from scratch
docker-compose up --build
```

### Enter Container Shell

```bash
docker exec -it angola-shell-jul-portal sh
```

### Check Nginx Configuration

```bash
docker exec angola-shell-jul-portal cat /etc/nginx/conf.d/default.conf
```

## Environment Variables

### Shell App (jul-portal)

- `LPCO_CNCA_URL` - URL to lpco-cnca-app micro-app

### Micro-App (lpco-cnca-app)

- `API_URL` - Backend API URL

## Azure Container Registry

### Login

```bash
az acr login --name yourregistry
```

### Tag and Push

```bash
docker tag angola/jul-portal:latest yourregistry.azurecr.io/angola/jul-portal:1.0.0
docker push yourregistry.azurecr.io/angola/jul-portal:1.0.0
```

## CI/CD Integration

See `.github/workflows/docker-build-push.yml` for GitHub Actions example.

## Additional Resources

- [Full Docker Implementation Plan](dox/DOCKER-IMPLEMENTATION-PLAN.md)
- [Project Setup Documentation](dox/PROJECT-SETUP.md)
