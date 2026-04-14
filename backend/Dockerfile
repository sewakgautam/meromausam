FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN mkdir -p logs

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --url=\"$DATABASE_URL\" --accept-data-loss && dumb-init node dist/main.js"]
