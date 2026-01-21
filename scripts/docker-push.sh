#!/bin/bash

set -e

# Configuration
REGISTRY=${REGISTRY:-"localhost"}
VERSION=${VERSION:-"latest"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Angola Platform - Docker Push${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Registry: ${YELLOW}$REGISTRY${NC}"
echo -e "Version:  ${YELLOW}$VERSION${NC}"
echo ""

# List of images to push
IMAGES=(
    "angola/jul-portal"
    "angola/lpco-cnca-app"
)

# Function to push image
push_image() {
    local image=$1
    
    echo -e "${BLUE}Pushing $image:$VERSION${NC}"
    docker push "$REGISTRY/$image:$VERSION"
    
    echo -e "${BLUE}Pushing $image:latest${NC}"
    docker push "$REGISTRY/$image:latest"
    
    echo -e "${GREEN}✓ Successfully pushed $image${NC}"
    echo ""
}

# Login to registry
if [ "$REGISTRY" != "localhost" ]; then
    echo -e "${YELLOW}Logging in to $REGISTRY${NC}"
    docker login "$REGISTRY"
    echo ""
fi

# Push all images
for image in "${IMAGES[@]}"; do
    push_image "$image"
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All images pushed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Images available at:${NC}"
for image in "${IMAGES[@]}"; do
    echo -e "  - ${YELLOW}$REGISTRY/$image:$VERSION${NC}"
    echo -e "  - ${YELLOW}$REGISTRY/$image:latest${NC}"
done
