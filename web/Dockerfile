FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Vite bakes VITE_* vars into the JS bundle at build time (there is no
# runtime env for a static site), so they're build args, not compose env.
ARG VITE_API_URL=https://kaizen-api.northernarchive.com
ARG VITE_AUTH_URL=https://auth.northernarchive.com/auth/v1
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUTH_URL=${VITE_AUTH_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
