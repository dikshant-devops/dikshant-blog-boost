# How to Add Blog Posts

## Quick Start

1. Create a new `.md` file in the `/public/blog-posts/` directory
2. Add frontmatter (optional - will be auto-generated if missing)
3. Write your content in Markdown
4. Save the file - it will automatically appear on your blog!

---

## File Location

**Path**: `/public/blog-posts/`

All markdown files in this directory are automatically discovered and displayed on the blog.

**Example**:
```
/public/blog-posts/
├── getting-started-with-docker.md
├── kubernetes-introduction.md
└── your-new-post.md  ← Add your file here
```

---

## Markdown File Format

### With Frontmatter (Recommended)

Create a file like `my-awesome-post.md`:

```markdown
---
title: "My Awesome DevOps Tutorial"
excerpt: "Learn how to deploy applications with Docker and Kubernetes"
date: "2024-01-20"
readTime: "8 min read"
tags: ["Docker", "Kubernetes", "DevOps"]
---

# My Awesome DevOps Tutorial

Your content starts here...

## Introduction

This tutorial will teach you...

## Step 1: Setup

First, install Docker...
```

### Without Frontmatter (Auto-Generated)

If you don't include frontmatter, the system will automatically generate it:

```markdown
# Getting Started with Docker

This is my blog post about Docker basics.

Docker is a containerization platform...
```

**Auto-generated values**:
- **Title**: Extracted from first heading or filename
- **Excerpt**: First paragraph (or first 150 characters)
- **Date**: Current date
- **Read Time**: Calculated from word count (200 words/minute)
- **Tags**: Auto-detected from content and filename

---

## Frontmatter Fields

### Required Fields (but all are optional!)

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `title` | String | `"Docker Guide"` | Post title (quotes required) |
| `excerpt` | String | `"Learn Docker basics"` | Short description for cards |
| `date` | String | `"2024-01-20"` | Publication date (YYYY-MM-DD) |
| `readTime` | String | `"5 min read"` | Estimated reading time |
| `tags` | Array | `["Docker", "DevOps"]` | Topic tags (see below) |

### Frontmatter Format Rules

```yaml
---
title: "Use quotes for titles with special characters"
excerpt: "Short description goes here"
date: "2024-01-20"
readTime: "5 min read"
tags: ["Tag1", "Tag2", "Tag3"]
---
```

**Important**:
- Must start with `---` on the first line
- Must end with `---` before content
- Use quotes for strings
- Use array format `["Item1", "Item2"]` for tags
- Date format: `YYYY-MM-DD`

---

## Tags System

### Available Tags

Tags are defined in `/src/config/tags.ts`. Current available tags:

| Tag | Description | Auto-detected From |
|-----|-------------|-------------------|
| `Docker` | Docker containerization | "docker" in filename/content |
| `Kubernetes` | Kubernetes orchestration | "kubernetes", "k8s" in filename/content |
| `CI/CD` | CI/CD pipelines | "cicd", "ci-cd", "ci/cd" in filename |
| `DevOps` | General DevOps | Default fallback if no tags match |
| `AWS` | Amazon Web Services | "aws" in filename/content |
| `Azure` | Microsoft Azure | "azure" in filename/content |
| `GCP` | Google Cloud Platform | "gcp", "google cloud" in filename/content |
| `Terraform` | Infrastructure as Code | "terraform" in filename/content |
| `Ansible` | Configuration Management | "ansible" in filename/content |
| `Jenkins` | Jenkins CI/CD | "jenkins" in filename/content |
| `GitHub Actions` | GitHub Actions | "github actions" in filename/content |
| `Linux` | Linux systems | "linux" in filename/content |
| `Networking` | Network concepts | "network", "routing" in filename/content |
| `Security` | Security topics | "security", "armor" in filename/content |
| `Monitoring` | Monitoring tools | "monitoring", "prometheus" in filename/content |
| `Cloud` | Cloud computing | "cloud" in filename/content |
| `Containers` | Container technology | "container" in filename/content |

### How Tag Auto-Detection Works

The system checks your filename and content for keywords:

**Example 1**: Filename `getting-started-with-docker.md`
- ✅ Auto-detects: `["Docker"]`

**Example 2**: Content mentions "kubernetes" and "docker"
- ✅ Auto-detects: `["Kubernetes", "Docker"]`

**Example 3**: Filename `cicd-pipeline-setup.md` with "GitHub Actions" in content
- ✅ Auto-detects: `["CI/CD", "GitHub Actions"]`

### Manual Tag Assignment

You can override auto-detection by specifying tags in frontmatter:

```yaml
---
title: "Advanced Kubernetes"
tags: ["Kubernetes", "DevOps", "Cloud"]
---
```

### Adding New Tags

1. Edit `/src/config/tags.ts`
2. Add your new tag to the `TAG_CONFIGS` object:

```typescript
export const TAG_CONFIGS: TagConfig = {
  // ... existing tags
  "Your New Tag": {
    color: "bg-purple-500",
    textColor: "text-white"
  }
};
```

3. The tag is now available for use!

---

## Markdown Syntax Supported

### GitHub Flavored Markdown (GFM)

Your blog supports full GFM syntax:

#### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

#### Text Formatting
```markdown
**bold text**
*italic text*
~~strikethrough~~
`inline code`
```

#### Code Blocks
````markdown
```javascript
function hello() {
  console.log("Hello World");
}
```
````

#### Lists
```markdown
- Unordered item
- Another item

1. Ordered item
2. Second item
```

#### Links
```markdown
[Link text](https://example.com)
```

#### Blockquotes
```markdown
> This is a quote
```

#### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

#### Task Lists
```markdown
- [x] Completed task
- [ ] Incomplete task
```

---

## File Naming Best Practices

### Recommended Format

Use lowercase with hyphens:
```
getting-started-with-docker.md ✅
kubernetes-deployment-guide.md ✅
cicd-pipeline-jenkins.md ✅
```

### Avoid

```
Getting Started With Docker.md ❌ (spaces)
kubernetes_guide.md ❌ (underscores preferred but ok)
MyBlogPost.md ❌ (camelCase)
```

### URL Generation

Filenames are converted to URLs:
- `getting-started-with-docker.md` → `/blog/getting-started-with-docker`
- `Host-Based vs Path-Based Routing.md` → `/blog/host-based-vs-path-based-routing`

Special characters and spaces are automatically converted to hyphens.

---

## Complete Example

**File**: `/public/blog-posts/kubernetes-deployment-tutorial.md`

```markdown
---
title: "Kubernetes Deployment Tutorial for Beginners"
excerpt: "Learn how to deploy your first application on Kubernetes with step-by-step instructions"
date: "2024-01-20"
readTime: "10 min read"
tags: ["Kubernetes", "DevOps", "Containers"]
---

# Kubernetes Deployment Tutorial for Beginners

In this comprehensive guide, we'll walk through deploying your first application on Kubernetes.

## Prerequisites

Before we begin, make sure you have:

- Docker installed
- kubectl configured
- A Kubernetes cluster (minikube is fine)

## Step 1: Create a Deployment

First, create a deployment YAML file:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx:latest
        ports:
        - containerPort: 80
```

## Step 2: Apply the Deployment

Run this command:

```bash
kubectl apply -f deployment.yaml
```

## Step 3: Verify

Check your pods:

```bash
kubectl get pods
```

You should see 3 pods running!

## Conclusion

Congratulations! You've deployed your first Kubernetes application. In the next tutorial, we'll explore Services and Ingress.

## Further Reading

- [Official Kubernetes Docs](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
```

---

## Tips & Tricks

### 1. **Preview Before Publishing**
- Run `npm run dev` locally
- Visit `http://localhost:8080/blog`
- Your post appears immediately!

### 2. **SEO Optimization**
- Use descriptive titles
- Write compelling excerpts (they appear in meta descriptions)
- Choose relevant tags
- Include keywords naturally in your content

### 3. **Read Time Estimation**
- Automatically calculated at 200 words/minute
- Can be overridden in frontmatter
- Format: `"X min read"` (e.g., "5 min read", "12 min read")

### 4. **Date Sorting**
- Posts are automatically sorted by date (newest first)
- Use consistent date format: `YYYY-MM-DD`
- Future dates are allowed (for scheduled posts)

### 5. **Content Length**
- No minimum or maximum length
- Excerpts auto-generated at 150 characters
- Longer content automatically gets longer read time

### 6. **Images**
- Place images in `/public/images/`
- Reference in markdown: `![Alt text](/images/my-image.png)`
- Supported formats: PNG, JPG, GIF, SVG, WebP

---

## Troubleshooting

### Post Not Appearing?

1. **Check file location**: Must be in `/public/blog-posts/`
2. **Check file extension**: Must be `.md`
3. **Check frontmatter syntax**: Must have `---` delimiters
4. **Clear cache**: Refresh browser or clear cache
5. **Check dev server**: Run `npm run dev` and check console for errors

### Tags Not Working?

1. **Check tag spelling**: Must match tags in `/src/config/tags.ts`
2. **Check array format**: `tags: ["Tag1", "Tag2"]` with quotes
3. **Check comma separation**: `["Tag1", "Tag2"]` not `["Tag1" "Tag2"]`

### Formatting Issues?

1. **Check markdown syntax**: Use proper GFM syntax
2. **Check code blocks**: Use triple backticks with language
3. **Check frontmatter**: Must be valid YAML
4. **Preview locally**: Run dev server to see live preview

---

## Quick Reference

```markdown
---
title: "Your Post Title"
excerpt: "Brief description"
date: "2024-01-20"
readTime: "5 min read"
tags: ["Tag1", "Tag2"]
---

# Main Heading

Your content here...

## Section

More content...

```code block```

**bold** *italic* `code`

[link](url)

- list item
```

---

## Need Help?

- Check existing posts in `/public/blog-posts/` for examples
- Review tag configurations in `/src/config/tags.ts`
- Test locally with `npm run dev` before committing
- All posts support full GitHub Flavored Markdown

Happy blogging! 🚀
