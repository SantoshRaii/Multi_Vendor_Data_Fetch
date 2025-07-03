# Base image
FROM node:18

# Working directory inside container
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Default command (gets overridden by docker-compose)
CMD ["node", "api/index.js"]
