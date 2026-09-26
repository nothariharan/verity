FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --prod=false

ENV NODE_ENV=production
EXPOSE 8787
CMD ["pnpm", "--filter", "server", "exec", "tsx", "src/main.ts"]
