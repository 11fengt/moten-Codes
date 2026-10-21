FROM node:24-bookworm-slim AS workspace
RUN npm install --global pnpm@12.6.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

FROM workspace AS editor-build
RUN pnpm install --frozen-lockfile
# Build sequentially on small VMs; type checking is a separate local check.
RUN NODE_OPTIONS=--max-old-space-size=768 pnpm --filter @learn-moten/editor build-only

FROM nginx:stable-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=editor-build /app/packages/editor/dist /usr/share/nginx/html

FROM workspace AS server
RUN pnpm --filter @learn-moten/server... install --prod --frozen-lockfile
COPY deploy/start-server.mjs ./deploy/start-server.mjs
ENV NODE_ENV=production
USER node
WORKDIR /app/packages/server
EXPOSE 8082
CMD ["node", "--import", "tsx", "../../deploy/start-server.mjs"]
