FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) for the server
# Adjust the path if your server's package.json is in a subdirectory
COPY package*.json ./
# COPY yarn.lock ./

# Install server dependencies
# If server and client have separate package.json, ensure you copy the correct one
RUN npm install --production
# Or RUN yarn install --production

# Copy the rest of the server application code
# This assumes the Dockerfile is in the 'server' directory
COPY . .

# Expose the port the app runs on (as defined by SERVER_PORT in .env.production)
# The default is 4242, Nginx will map to this.
EXPOSE 4242

# Healthcheck (optional but recommended)
# Adjust the healthcheck path and interval as needed
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:4242/health || exit 1

# Start the server
CMD [ "node", "index.js" ] 