# ========================================
# Stage 1: Base - Install Dependencies
# ========================================
FROM node:20-alpine AS base

WORKDIR /app

# Set Node options for ES modules compatibility
ENV NODE_OPTIONS=--max-old-space-size=4096

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy workspace files
COPY . .

# ========================================
# Stage 2: Build Shared Libraries
# ========================================
FROM base AS build-shared

WORKDIR /app

# Copy pre-built shared libraries from local dist
COPY dist/libs ./dist/libs

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

# Copy built application from browser subdirectory
COPY --from=build-app /app/dist/apps/shell-apps/jul-portal/browser /usr/share/nginx/html

# Copy environment script for runtime configuration
COPY docker/shell-apps/jul-portal/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Create cache and run directories with proper permissions for nginx user
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/run/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/run/nginx \
    && chmod -R 755 /var/cache/nginx \
    && chmod -R 755 /var/run/nginx \
    && sed -i 's|/run/nginx.pid|/var/run/nginx/nginx.pid|g' /etc/nginx/nginx.conf

# Labels
LABEL maintainer="Angola Platform Team"
LABEL app="jul-portal"
LABEL type="shell-app"

EXPOSE 80

# Run as non-root user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
