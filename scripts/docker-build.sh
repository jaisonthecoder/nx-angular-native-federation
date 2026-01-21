#!/bin/bash

set -e  # Exit on error

# Configuration
REGISTRY=${REGISTRY:-"localhost"}
VERSION=${VERSION:-"latest"}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    
    echo -e "${BLUE}Building $app_type: $app_name${NC}"
    
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
echo ""
build_image "Shell App" "jul-portal" "docker/shell-apps/jul-portal/Dockerfile"

# Build Micro-Apps
echo -e "${YELLOW}Building Micro Applications...${NC}"
echo ""
build_image "Micro-App" "lpco-cnca-app" "docker/micro-apps/lpco-cnca-app/Dockerfile"

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}========================================${NC}"
docker images | grep "angola/" | head -10
echo ""
echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Test locally: ${YELLOW}docker-compose up${NC}"
echo -e "  2. Push to registry: ${YELLOW}./scripts/docker-push.sh${NC}"
