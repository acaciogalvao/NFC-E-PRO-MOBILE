# Estágio de Build
FROM node:22-slim AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar o resto do código
COPY . .

# Build do frontend e backend
RUN pnpm run build

# Estágio de Produção
FROM node:22-slim

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar apenas o necessário do estágio de build
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/node_modules ./node_modules

# Expor portas
EXPOSE 3000 3001

# Comando para rodar a aplicação (em produção, geralmente servimos o front estático)
CMD ["pnpm", "run", "server"]
