FROM node:20-alpine as builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_OPTIONS=--max-old-space-size=4096

RUN pnpm build \
    && cp -a dist/. public/

FROM nginx:1.19-alpine AS server

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder ./app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 