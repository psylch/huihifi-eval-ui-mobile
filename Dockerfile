# Stage 1: Build
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV VITE_BASE=/m/
ENV VITE_API_BASE_URL=
RUN bun run build

# Stage 2: Serve static files
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
RUN cat > /etc/caddy/Caddyfile <<'EOF'
:8080 {
    root * /srv
    file_server
    try_files {path} /index.html
}
EOF
EXPOSE 8080
