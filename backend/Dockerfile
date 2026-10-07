FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de compilación para módulos nativos (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]