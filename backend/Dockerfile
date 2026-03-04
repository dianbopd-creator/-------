# —— Base image ——
FROM node:20-alpine

# Install sqlite native build tools
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY . .

# Create the /data directory for SQLite volume mount
RUN mkdir -p /data

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
