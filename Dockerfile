# ==============================================================================
# HuffX — Production Multi-Runtime Container (Node.js 20 + Python 3)
# Suitable for Render.com, Railway.app, Fly.io, or standard Docker hosts.
# ==============================================================================

FROM node:20-alpine AS runner

# Install Python 3 (HuffX uses pure standard-library DSA, zero pip packages needed)
RUN apk add --no-cache python3

WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Set production environment and build Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Default fallback port if not injected by cloud provider ($PORT is set automatically by Render/Railway)
ENV PORT=5000
EXPOSE 5000

# Start Next.js production server
CMD ["npm", "start"]
