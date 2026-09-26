# ============================================================
# BASE
# ============================================================

FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install


# ============================================================
# DESENVOLVIMENTO
# ============================================================

FROM base AS development

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ============================================================
# BUILD DE PRODUÇÃO
# ============================================================

FROM base AS build

COPY . .

ARG VITE_API_URL=/api

ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ============================================================
# PRODUÇÃO
# ============================================================

FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]