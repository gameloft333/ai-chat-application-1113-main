FROM node:18-alpine

WORKDIR /usr/src/app

# --- BEGIN COPY DIAGNOSTICS ---
RUN echo "DEBUG: Listing WORKDIR (/usr/src/app) initially:" && ls -al .
# --- END COPY DIAGNOSTICS ---

# Copy package.json and package-lock.json from the project root (build context is now project root)
COPY package.json ./
COPY package-lock.json ./

# --- BEGIN POST-COPY DIAGNOSTICS ---
RUN echo "DEBUG: Listing WORKDIR (/usr/src/app) AFTER package.json copies:" && ls -al .
RUN echo "DEBUG: Content of /usr/src/app/package.json AFTER package.json copies:" && (cat /usr/src/app/package.json || echo "DEBUG: package.json NOT FOUND in /usr/src/app after COPY")
# --- END POST-COPY DIAGNOSTICS ---

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

# --- BEGIN PRE-CMD BUILD DIAGNOSTICS --- 
RUN echo "DEBUG: (BUILD-TIME) --- Contents of /usr/src/app before CMD --- " && ls -la /usr/src/app
RUN echo "DEBUG: (BUILD-TIME) --- Content of /usr/src/app/package.json before CMD --- " && (cat /usr/src/app/package.json || echo "DEBUG: (BUILD-TIME) package.json not found in /usr/src/app at final build check")
RUN echo "DEBUG: (BUILD-TIME) --- Node.js version --- " && node --version
# --- END PRE-CMD BUILD DIAGNOSTICS --- 

# Expose the port the app runs on (as defined by SERVER_PORT in .env.production)
# The default is 4242, Nginx will map to this.
EXPOSE 4242

# Healthcheck (optional but recommended)
# Adjust the healthcheck path and interval as needed
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:4242/health || exit 1

# Modified CMD to print environment variables before starting node
CMD echo "RUNTIME ENV VARS (from CMD):" && printenv && echo "--- ls -la /usr/src/app (from CMD): ---" && ls -la /usr/src/app && echo "--- package.json content at RUNTIME (from CMD): ---" && cat /usr/src/app/package.json && echo "--- END package.json --- Starting node..." && node index.js 