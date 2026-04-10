# build stage
FROM oven/bun:1.2.19 AS build
WORKDIR /app
COPY . .
RUN bun install
# Same-origin /api in the browser; nginx proxies to Django (avoids shipping index.html as "JSON").
# Overrides VITE_BACKEND_API from .env during this image build (Vite prefers process.env over .env).
ARG VITE_BACKEND_API=/api
ENV VITE_BACKEND_API=$VITE_BACKEND_API
RUN bun run build

# serve stage
FROM nginx:alpine
# เพิ่มบรรทัดนี้: Copy config ที่เราสร้างไปทับอันเดิมของ nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]