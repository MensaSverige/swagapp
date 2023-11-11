# Use the official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Copy the backend directory contents into the container
COPY ./backend /app

# Copy the ./schema files into the /app/schema directory
COPY ./schema /app/schema

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt


# Expose the port the app runs on
EXPOSE 5000

# Run the application with Gunicorn on port 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "server:app"]
