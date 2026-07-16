# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---- Runtime stage ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
COPY --from=build /app/dist/digital-platform-hub/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/30-env-config.sh /docker-entrypoint.d/30-env-config.sh
RUN chmod +x /docker-entrypoint.d/30-env-config.sh \
    && chown -R nginx:nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080
