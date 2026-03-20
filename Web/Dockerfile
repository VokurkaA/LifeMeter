FROM node:20-alpine AS deps
WORKDIR /workspace/Web

COPY Web/package.json Web/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /workspace/Web

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /workspace/Web/node_modules ./node_modules
COPY Web/package.json Web/package-lock.json Web/next.config.ts Web/tsconfig.json Web/next-env.d.ts Web/postcss.config.mjs ./
COPY Web/app ./app
COPY Web/components ./components
COPY Web/lib ./lib
COPY Web/pages ./pages
COPY App/src/assets ../App/src/assets

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /workspace/Web/.next/standalone ./
COPY --from=builder /workspace/Web/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
