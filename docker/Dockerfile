FROM node:22.11-alpine AS builder

WORKDIR /chatterbox

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:22.11-alpine AS release

WORKDIR /chatterbox

COPY --from=builder /chatterbox/dist ./dist
COPY --from=builder /chatterbox/package*.json ./

RUN npm ci --omit=dev

#USER node

CMD ["node", "dist/main"]