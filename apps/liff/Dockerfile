FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/liff/package.json ./apps/liff/

RUN npm install

COPY packages/shared ./packages/shared
RUN npm run build --workspace=packages/shared

COPY apps/liff ./apps/liff
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=apps/liff

FROM nginx:alpine
COPY --from=builder /app/apps/liff/dist /usr/share/nginx/html
COPY apps/liff/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
