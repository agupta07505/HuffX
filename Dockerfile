
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN npm run build

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-10000}"]
