#>>dogen
################################################################################
#                                                                              #
#                               Workspace setup                                #
#                                                                              #
################################################################################
FROM alpine:3.12 AS workspace_jq
RUN apk add --update --no-cache jq

FROM node:20.15.0-alpine AS workspace_base_node
ENV YARN_VERSION=4.1.1
RUN corepack enable && yarn set version 4.1.1

# Extract minimal fields for dependencies installation
# This step avoid reinstalling node_modules due to field that is unrelated
FROM workspace_jq AS workspace_extract_deps
COPY package.json /tmp/package.json
RUN jq '{name, dependencies, devDependencies}' < /tmp/package.json > /tmp/deps.json

# Install node_modules
FROM workspace_base_node AS workspace_install_modules
WORKDIR /home/node/workspace
COPY --from=workspace_extract_deps /tmp/deps.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
RUN ["yarn","install","--refresh-lockfile"]

FROM workspace_install_modules AS workspace
WORKDIR /home/node/workspace
COPY package.json package.json

################################################################################
#                                                                              #
#                                 Package: api                                 #
#                                                                              #
################################################################################
FROM workspace_jq AS api_jq

FROM workspace_base_node AS api_base_node

# Extract minimal fields for dependencies installation
# This step avoid reinstalling node_modules due to field that is unrelated
FROM api_jq AS api_extract_deps
COPY api/package.json /tmp/package.json
RUN jq '{name, dependencies, devDependencies}' < /tmp/package.json > /tmp/deps.json

# Install node_modules
FROM workspace AS api_install_modules
WORKDIR /home/node/workspace/api
COPY --from=api_extract_deps /tmp/deps.json package.json
RUN ["yarn","install","--refresh-lockfile"]

# Build
FROM api_install_modules AS api_build
WORKDIR /home/node/workspace/api
COPY api/package.json package.json
COPY api/tsconfig.json tsconfig.json
COPY api/drizzle drizzle
COPY api/drizzle.config.ts drizzle.config.ts
COPY api/vite.config.ts vite.config.ts
COPY api/src src
RUN ["yarn","run","build"]

FROM api_build AS api_service
CMD yarn run start

################################################################################
#                                                                              #
#                                 Package: app                                 #
#                                                                              #
################################################################################
FROM workspace_jq AS app_jq

FROM workspace_base_node AS app_base_node

# Extract minimal fields for dependencies installation
# This step avoid reinstalling node_modules due to field that is unrelated
FROM app_jq AS app_extract_deps
COPY app/package.json /tmp/package.json
RUN jq '{name, dependencies, devDependencies}' < /tmp/package.json > /tmp/deps.json

# Install node_modules
FROM workspace AS app_install_modules
WORKDIR /home/node/workspace/app
COPY --from=app_extract_deps /tmp/deps.json package.json
RUN ["yarn","install","--refresh-lockfile"]

# Build
FROM app_install_modules AS app_build
WORKDIR /home/node/workspace/app
COPY app/package.json package.json
COPY app/.env.prod .env.prod
COPY app/tsconfig.json tsconfig.json
COPY app/features features
COPY app/utils utils
COPY app/common common
COPY app/assets assets
COPY app/global.css global.css
COPY app/tailwind.config.js tailwind.config.js
COPY app/nativewind.d.ts nativewind.d.ts
COPY app/nativewind-env.d.ts nativewind-env.d.ts
COPY app/metro.config.js metro.config.js
COPY app/babel.config.js babel.config.js
COPY app/expo-env.d.ts expo-env.d.ts
COPY app/index.js index.js
COPY app/app app
RUN ["yarn","run","expo","export","-p","web"]

# Serve built static files using a reverse proxy
FROM nginx:stable-alpine AS app_serve
COPY --from=app_build /home/node/workspace/app/dist /usr/share/nginx/html
COPY <<-"EOT" /etc/nginx/conf.d/default.conf
server {
  listen       80;
  server_name  localhost;

  location / {
      root   /usr/share/nginx/html;
      index  index.html index.htm;
      try_files $uri /index.html;
  }

  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
      root   /usr/share/nginx/html;
  }
}
EOT
EXPOSE 80
#<<dogen
