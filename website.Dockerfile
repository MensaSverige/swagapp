# Use the official Nginx image as a parent image
FROM nginx:alpine

# Copy the content of the 'website' directory to the Nginx web directory
COPY ./website /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

# Use the default Nginx command to run the server
CMD ["nginx", "-g", "daemon off;"]
