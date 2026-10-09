FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=optional
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8788
EXPOSE 8788
CMD ["node", "dist/index.js"]
