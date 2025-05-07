FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the project root (build context is now project root)
COPY package.json ./
COPY package-lock.json ./
# If you use yarn:
# COPY yarn.lock ./

# Force IPv4 for DNS resolution during npm install
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Install dependencies
RUN npm install --production
# Or if you use yarn: 
# RUN yarn install --production --frozen-lockfile

# Unset NODE_OPTIONS if it's not needed for runtime
ENV NODE_OPTIONS=

# Copy the server-specific application code from the ./server directory (relative to context)
COPY ./server/ /usr/src/app/

# Expose the port the app runs on (as defined by SERVER_PORT in .env.production)
# The default is 4242, Nginx will map to this.
EXPOSE 4242

# Healthcheck (optional but recommended)
# Adjust the healthcheck path and interval as needed
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:4242/health || exit 1

# Start the server
CMD [ "node", "index.js" ] 