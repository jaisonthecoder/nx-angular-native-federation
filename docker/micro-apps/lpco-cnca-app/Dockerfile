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

# Labels
LABEL maintainer="Angola Platform Team"
LABEL app="lpco-cnca-app"
LABEL type="micro-app"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
