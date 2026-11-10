# Сервер картинок. Конфигурация — /app/config.json (или IPFS_IMAGES_CONFIG),
# файлы при filesystem-хранилище — в /app/data
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache git
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY *.js config.json.example ./
RUN mkdir -p data && chown node:node data
VOLUME /app/data
USER node
EXPOSE 8002
CMD ["node", "server.js"]
