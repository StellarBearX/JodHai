FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm install

# Generate Prisma client BEFORE building (types needed for tsc)
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

# Build shared package
COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

# Build API
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
RUN npm run build --workspace=apps/api

EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/server.js"]
