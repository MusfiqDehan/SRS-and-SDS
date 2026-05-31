# ---- Backend Dockerfile (multi-stage, production-ready) ----
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies separately for better layer caching.
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Final runtime image
FROM base AS runner
ENV PORT=4000
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as non-root for security.
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 4000
CMD ["node", "src/server.js"]
