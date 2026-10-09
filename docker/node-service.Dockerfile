# One image recipe for every Node workspace service (agent APIs, services/*). Build from the REPO ROOT:
#   docker build -f docker/node-service.Dockerfile \
#     --build-arg WORKSPACE=@akaya/link-redirect --build-arg DIR=services/link-redirect --build-arg ENTRY=dist/server.js .
FROM node:22-alpine AS build
WORKDIR /repo
COPY . .
ARG WORKSPACE
RUN npm ci --ignore-scripts -w @akaya/config -w @akaya/affiliate -w @akaya/server-kit -w @akaya/tz -w "$WORKSPACE" \
 && npm run build:packages \
 && npm run build -w "$WORKSPACE"

FROM node:22-alpine
ARG DIR
ARG ENTRY=dist/index.js
ENV NODE_ENV=production HOST=0.0.0.0 ENTRY=$ENTRY
COPY --from=build /repo /repo
# named volumes inherit this ownership, so the non-root user can write DATA_FILE
RUN mkdir -p /data && chown node:node /data
WORKDIR /repo/$DIR
USER node
CMD ["sh", "-c", "exec node \"$ENTRY\""]
