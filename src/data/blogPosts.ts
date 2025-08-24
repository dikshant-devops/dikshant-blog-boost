export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "getting-started-with-docker",
    title: "Getting Started with Docker: A Complete Beginner's Guide",
    excerpt: "Learn the fundamentals of Docker containerization, from basic concepts to creating your first containerized application.",
    date: "2025-01-15",
    readTime: "8 min read",
    tags: ["Docker", "Containerization", "DevOps"],
    content: `# Getting Started with Docker: A Complete Beginner's Guide

Docker has revolutionized the way we develop, deploy, and manage applications. In this comprehensive guide, we'll explore Docker from the ground up.

## What is Docker?

Docker is a containerization platform that packages applications and their dependencies into lightweight, portable containers. These containers can run consistently across different environments.

### Key Benefits of Docker

- **Consistency**: "It works on my machine" becomes a thing of the past
- **Isolation**: Applications run in isolated environments
- **Efficiency**: Containers share the host OS kernel, making them lightweight
- **Scalability**: Easy to scale applications up or down

## Basic Docker Concepts

### Images vs Containers

- **Docker Image**: A read-only template used to create containers
- **Docker Container**: A running instance of an image

### Docker Architecture

Docker uses a client-server architecture:

- **Docker Daemon**: Manages Docker objects (images, containers, networks)
- **Docker Client**: Interface for users to interact with Docker
- **Docker Registry**: Stores Docker images (like Docker Hub)

## Installing Docker

### On Ubuntu/Debian

\`\`\`bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
\`\`\`

### On Windows/macOS

Download Docker Desktop from the official website and follow the installation wizard.

## Your First Docker Container

Let's run your first container:

\`\`\`bash
# Run a simple hello-world container
docker run hello-world
\`\`\`

This command downloads the hello-world image and runs it in a container.

## Essential Docker Commands

### Container Management

\`\`\`bash
# List running containers
docker ps

# List all containers
docker ps -a

# Stop a container
docker stop container_name

# Remove a container
docker rm container_name
\`\`\`

## Best Practices

1. **Use Official Images**: Start with official base images when possible
2. **Minimize Layers**: Combine RUN commands to reduce image size
3. **Use .dockerignore**: Exclude unnecessary files from the build context
4. **Don't Run as Root**: Create and use a non-root user in containers

## Conclusion

Docker is an essential tool in modern software development. By containerizing your applications, you ensure consistency, improve deployment efficiency, and simplify scaling.

Start experimenting with Docker today, and you'll soon see why it's become the standard for application containerization.`
  },
  {
    id: "introduction-to-kubernetes",
    title: "Introduction to Kubernetes: Container Orchestration Made Simple",
    excerpt: "Discover how Kubernetes can help you manage containerized applications at scale with automated deployment, scaling, and management.",
    date: "2025-01-10",
    readTime: "12 min read",
    tags: ["Kubernetes", "Container Orchestration", "DevOps"],
    content: `# Introduction to Kubernetes: Container Orchestration Made Simple

Kubernetes has become the de facto standard for container orchestration. In this guide, we'll explore what Kubernetes is and how it can transform your container management.

## What is Kubernetes?

Kubernetes (K8s) is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications.

### Why Use Kubernetes?

- **Automatic Scaling**: Scale applications based on demand
- **Self-healing**: Replace failed containers automatically
- **Load Balancing**: Distribute traffic across healthy containers
- **Rolling Updates**: Deploy updates without downtime
- **Service Discovery**: Containers can find and communicate with each other

## Core Kubernetes Concepts

### Cluster

A Kubernetes cluster consists of:
- **Master Node**: Controls the cluster
- **Worker Nodes**: Run the actual applications

### Pods

- Smallest deployable unit in Kubernetes
- Contains one or more containers
- Containers in a pod share storage and network

### Services

- Stable endpoint for accessing pods
- Provides load balancing and service discovery

## Essential kubectl Commands

### Viewing Resources

\`\`\`bash
# Get all pods
kubectl get pods

# Get services
kubectl get services

# Get deployments
kubectl get deployments
\`\`\`

### Managing Applications

\`\`\`bash
# Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Update image
kubectl set image deployment/nginx-deployment nginx=nginx:1.20
\`\`\`

## Best Practices

### Resource Management

1. **Set Resource Limits**: Define CPU and memory limits
2. **Use Namespaces**: Organize resources logically
3. **Health Checks**: Implement liveness and readiness probes

### Security

1. **RBAC**: Use Role-Based Access Control
2. **Network Policies**: Control traffic between pods
3. **Pod Security Standards**: Enforce security policies

## Conclusion

Kubernetes provides powerful capabilities for managing containerized applications at scale. While it has a learning curve, the benefits in terms of scalability, reliability, and operational efficiency make it essential for modern application deployment.

Start with simple deployments and gradually explore more advanced features as your needs grow.`
  },
  {
    id: "cicd-with-github-actions",
    title: "CI/CD with GitHub Actions: Automate Your Development Workflow",
    excerpt: "Learn how to set up continuous integration and deployment pipelines using GitHub Actions to automate testing, building, and deploying your applications.",
    date: "2025-01-05",
    readTime: "10 min read",
    tags: ["CI/CD", "GitHub Actions", "Automation", "DevOps"],
    content: `# CI/CD with GitHub Actions: Automate Your Development Workflow

GitHub Actions has revolutionized how developers implement CI/CD pipelines. In this comprehensive guide, we'll explore how to automate your development workflow.

## What is CI/CD?

**Continuous Integration (CI)**: Automatically test and build code changes
**Continuous Deployment (CD)**: Automatically deploy tested code to production

### Benefits of CI/CD

- **Faster Development**: Automate repetitive tasks
- **Higher Quality**: Catch bugs early with automated testing
- **Reliable Deployments**: Consistent deployment process
- **Faster Feedback**: Quick feedback on code changes

## Introduction to GitHub Actions

GitHub Actions is a CI/CD platform integrated directly into GitHub repositories.

### Key Concepts

- **Workflow**: Automated process defined in YAML
- **Job**: Set of steps that execute on the same runner
- **Step**: Individual task within a job
- **Action**: Reusable unit of code
- **Runner**: Server that executes workflows

## Creating Your First Workflow

### Basic Workflow Structure

Create \`.github/workflows/ci.yml\`:

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
\`\`\`

## Working with Secrets

### Adding Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secrets like API_KEY, DATABASE_URL, etc.

### Using Secrets in Workflows

\`\`\`yaml
steps:
- name: Deploy to AWS
  env:
    AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: |
    aws s3 sync ./dist s3://my-bucket
\`\`\`

## Best Practices

### Workflow Organization

1. **Keep workflows simple**: Break complex workflows into smaller, focused ones
2. **Use caching**: Cache dependencies and build outputs
3. **Fail fast**: Run quick tests first
4. **Parallel execution**: Run independent jobs in parallel

### Security

1. **Least privilege**: Grant minimal permissions needed
2. **Secure secrets**: Never log or expose secrets
3. **Pin action versions**: Use specific versions instead of @main
4. **Review third-party actions**: Audit actions before using

## Conclusion

GitHub Actions provides a powerful platform for implementing CI/CD pipelines. By automating testing, building, and deployment processes, you can improve code quality, reduce manual errors, and accelerate your development workflow.

Start with simple workflows and gradually add complexity as your needs grow. Remember to follow best practices for security, performance, and maintainability.`
  }
];

// Function to get all blog posts (simulating async behavior for future API integration)
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  // In the future, this could fetch from an API or load markdown files
  return Promise.resolve(blogPosts);
};

// Function to get a single blog post by ID
export const getBlogPost = async (id: string): Promise<BlogPost | undefined> => {
  return Promise.resolve(blogPosts.find(post => post.id === id));
};