# One image recipe for the agent web UIs (Vite build served by nginx). Build from the REPO ROOT:
#   docker build -f docker/vite-web.Dockerfile \
#     --build-arg WORKSPACE=@akaya/shopping-agent-frontend --build-arg DIR=agents/shopping-agent/frontend .
FROM node:22-alpine AS build
WORKDIR /repo
COPY . .
ARG WORKSPACE
ARG DIR
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci --ignore-scripts -w @akaya/config -w @akaya/affiliate -w @akaya/ui -w "$WORKSPACE" \
 && npm run build -w @akaya/affiliate \
 && npm run build -w "$WORKSPACE" \
 && cp -r "$DIR/dist" /out

FROM nginx:1.27-alpine
# API_UPSTREAM is substituted into the template at start (nginx image envsubst)
ENV API_UPSTREAM=http://api:8787
COPY docker/nginx-spa.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
