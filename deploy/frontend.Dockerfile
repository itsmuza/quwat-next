# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

FROM dependencies AS build
ARG REACT_APP_API_URL
ARG REACT_APP_API_GRAPHQL_URL
ARG REACT_APP_API_WS
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=2048 \
    REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_API_GRAPHQL_URL=${REACT_APP_API_GRAPHQL_URL} \
    REACT_APP_API_WS=${REACT_APP_API_WS}
COPY . .
RUN test "$REACT_APP_API_URL" = "https://api.quwat.tech" \
    && test "$REACT_APP_API_GRAPHQL_URL" = "https://api.quwat.tech/graphql" \
    && test "$REACT_APP_API_WS" = "wss://api.quwat.tech" \
    && yarn build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG APP_UID=1000
ARG APP_GID=1000
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOME=/tmp
RUN test "$APP_UID" -gt 0 && test "$APP_GID" -gt 0 \
    && chown "$APP_UID:$APP_GID" /app
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/package.json /app/next.config.js /app/next-i18next.config.js ./
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/node_modules ./node_modules
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/.next ./.next
COPY --from=build --chown=${APP_UID}:${APP_GID} /app/public ./public
USER ${APP_UID}:${APP_GID}
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
