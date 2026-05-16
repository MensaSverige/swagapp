# Stage 1: Build the Expo web app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Set environment variables for the build
ENV EXPO_PUBLIC_API_URL=/api
ENV EXPO_PUBLIC_API_VERSION=v1
ENV NODE_ENV=production
ENV APP_VARIANT=production

# Install dependencies and build the Expo web app
WORKDIR /app/mensasverige
RUN yarn install --frozen-lockfile
RUN npx expo export --platform web

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the Expo web app output from the builder stage
COPY --from=builder /app/mensasverige/dist /usr/share/nginx/html

# Copy the custom Nginx configuration file
COPY ./website.nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Use the default Nginx command to run the server
CMD ["nginx", "-g", "daemon off;"]
