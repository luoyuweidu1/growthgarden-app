# Use Node.js 20 official image (18 is deprecated for Supabase)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables for IPv4-first DNS resolution
ENV NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=512"
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/

# Install all dependencies (including devDependencies for build)
RUN npm ci --no-cache

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application with IPv4-first DNS
CMD ["node", "--dns-result-order=ipv4first", "dist/index.js"]