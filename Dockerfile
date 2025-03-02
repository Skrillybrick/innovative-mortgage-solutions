# Stage 1: Build the Angular application
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build -- --configuration production

# Stage 2: Serve the application with nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist/*/. /usr/share/nginx/html/

# Configure nginx to listen on the port provided by Heroku
RUN echo 'server {\n\
    listen $PORT default_server;\n\
    server_name _;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Create start script to replace PORT in the nginx config at runtime
RUN echo '#!/bin/sh\n\
sed -i -e "s/\$PORT/'"'$PORT'"'/g" /etc/nginx/conf.d/default.conf\n\
nginx -g "daemon off;"' > /start.sh && \
chmod +x /start.sh

# Command to run when the container starts
CMD ["/start.sh"]