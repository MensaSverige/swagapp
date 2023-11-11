# Use the official Nginx image as a parent image
FROM nginx:alpine

# Copy the content of the 'website' directory to the Nginx web directory
COPY ./website /usr/share/nginx/html

# Copy the custom Nginx configuration file
COPY ./website.nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Use the default Nginx command to run the server
CMD ["nginx", "-g", "daemon off;"]
