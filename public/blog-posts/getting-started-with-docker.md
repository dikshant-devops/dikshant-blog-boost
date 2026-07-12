---
title: "Getting Started with Docker: A Beginner's Guide"
excerpt: "Learn the fundamentals of Docker containerization and how to get started with your first container."
date: "2024-12-15"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "Containers"
platform: "Docker"
difficulty: "Beginner"
image: "/images/social/containers.png"
tags: ["Docker", "DevOps", "Containers"]
tools: ["Docker"]
---

Docker packages an application process, its runtime, and its filesystem dependencies into an image. This guide builds a small image, runs it as a container, and separates local convenience from production controls.

## What is Docker?

Docker is a containerization platform that allows you to package applications and their dependencies into lightweight, portable containers. These containers can run consistently across different environments, from your local development machine to production servers.

## Why Use Docker?

### 1. Consistency Across Environments
- **Development to Production Parity**: Your application runs the same way everywhere
- **No More "It Works on My Machine"**: Eliminate environment-specific bugs

### 2. Efficient Resource Usage
- **Lightweight**: Containers share the host OS kernel
- **Fast Startup**: Containers start in seconds, not minutes

### 3. Easy Scaling
- **Horizontal Scaling**: Spin up multiple instances quickly
- **Microservices**: Perfect for microservices architecture

## Installing Docker

Install Docker Desktop on macOS or Windows, or Docker Engine and the Compose plugin on Linux. Use Docker's [installation documentation](https://docs.docker.com/engine/install/) for the operating system instead of copying repository commands that may have changed.

Verify both the engine client and the Compose plugin:

```bash
docker version
docker compose version
```

On Linux, membership in the `docker` group effectively grants root-level control of the host. Add users only when that trust level is appropriate, or use a supported rootless setup.

## Your First Docker Container

Let's start with a simple example - running a basic web server:

```bash
# Pull and run an nginx container
docker run -d -p 127.0.0.1:8080:80 --name my-web-server nginx:stable-alpine

# Check running containers
docker ps

# View logs
docker logs my-web-server

# Stop the container
docker stop my-web-server

# Remove the container
docker rm my-web-server
```

## Understanding Docker Images and Containers

### Images
- **Blueprint**: Templates for creating containers
- **Layered**: Built in layers for efficiency
- **Immutable**: Never change once created

### Containers
- **Instance**: Running instance of an image
- **Isolated**: Own filesystem, network, and processes
- **Ephemeral**: Can be easily created and destroyed

## Creating Your Own Dockerfile

A Dockerfile is a text file that contains instructions for building a Docker image:

```dockerfile
# Use a supported Node.js release. Pin the patch version or digest in production.
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY --chown=node:node . .

# Expose port
EXPOSE 3000

# Drop root privileges before starting the application
USER node

# Start the application
CMD ["npm", "start"]
```

Build and run your custom image:

```bash
# Build the image
docker build -t my-node-app .

# Run the container
docker run -p 3000:3000 my-node-app
```

## Docker Compose for Multi-Container Applications

For applications with multiple services, use Docker Compose:

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      redis:
        condition: service_healthy
    environment:
      REDIS_URL: redis://redis:6379

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Start the project with `docker compose up -d`, inspect it with `docker compose ps`, and remove its containers and network with `docker compose down`. The top-level `version` field is obsolete in the current Compose Specification and should be omitted.

## Best Practices

### 1. Keep Images Small
- Choose a minimal, maintained base image that is compatible with the application; Alpine uses musl libc and is not automatically the best option for every runtime
- Remove unnecessary packages and files
- Use multi-stage builds for production images

### 2. Security
- Don't run containers as root
- Scan images for vulnerabilities
- Keep base images updated

### 3. Data Management
- Use volumes for persistent data
- Don't store data in containers
- Back up important volumes

## Common Docker Commands

```bash
# Image management
docker images                  # List images
docker pull <image>           # Download image
docker rmi <image>            # Remove image

# Container management
docker ps                     # List running containers
docker ps -a                  # List all containers
docker run <image>            # Create and start container
docker start <container>      # Start stopped container
docker stop <container>       # Stop running container
docker rm <container>         # Remove container

# Debugging
docker logs <container>       # View logs
docker exec -it <container> sh    # Use a shell that exists in the image
docker inspect <container>    # View container details
```

## Next Steps

Now that you understand Docker basics, consider exploring:

1. **Image supply chain**: Pin base images, generate provenance, and scan the resulting image
2. **Compose overrides**: Separate local and production-specific configuration
3. **CI/CD integration**: Build once, test the image, and promote the same digest
4. **Runtime security**: Drop capabilities, use read-only filesystems where possible, and avoid privileged containers
5. **Orchestration**: Evaluate Kubernetes or another scheduler only when multi-host requirements justify it

## Conclusion

Docker makes an application filesystem and runtime configuration repeatable across environments. That consistency still depends on immutable inputs, explicit configuration, and testing the built image rather than rebuilding it separately in each environment.

Before publishing an image, verify the configured user, exposed ports, health behavior, image size, and vulnerability findings. A container makes dependencies repeatable; it does not make the application secure or highly available by itself.

## References

- [Docker Engine installation](https://docs.docker.com/engine/install/)
- [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/)
- [Compose Specification](https://docs.docker.com/reference/compose-file/)
- [Docker security](https://docs.docker.com/engine/security/)
