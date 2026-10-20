# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS build
COPY . .
RUN npm run build

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG APP_UID=1000
ARG APP_GID=1000
ENV NODE_ENV=production PORT_API=3007 HOME=/tmp
RUN test "$APP_UID" -gt 0 && test "$APP_GID" -gt 0 \
    && mkdir -p /app/uploads \
    && chown "$APP_UID:$APP_GID" /app /app/uploads
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/dist ./dist
COPY --from=production-dependencies --chown=${APP_UID}:${APP_GID} /app/node_modules ./node_modules
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/package.json ./package.json
USER ${APP_UID}:${APP_GID}
EXPOSE 3007
CMD ["node", "dist/apps/quwat/main.js"]
