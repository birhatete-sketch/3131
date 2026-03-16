# Stage 1: build
FROM node:18-buster AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# use ci for reproducible install, omit optional deps to avoid rollup-musl issue
RUN npm ci --omit=optional
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
