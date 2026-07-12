# How to Add Blog Posts

## Quick Start

1. Create a new `.md` file in the `/public/blog-posts/` directory
2. Add valid frontmatter using the schema below
3. Write your content in Markdown
4. Run `npm run content:index` to regenerate the local blog index, sitemap, RSS feed, and robots metadata
5. Build or deploy - `npm run build` also regenerates these artifacts automatically

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

### Required Frontmatter

Create a file like `my-awesome-post.md`:

```markdown
---
title: "Configure Cloud Armor for Production Workloads"
excerpt: "A tested Cloud Armor security guide with policy configuration, verification commands, observed results, and rollback steps."
date: "2024-01-20"
readTime: "8 min read"
author: "Dikshant Rai"
category: "Security"
platform: "GCP"
difficulty: "Beginner"
tools: ["Cloud Armor", "Load Balancer"]
tags: ["GCP", "Security", "Cloud Armor"]
image: "/og-default.jpg"
---

Your content starts here...

## Introduction

This tutorial will teach you...

## Step 1: Setup

First, install Docker...
```

## Frontmatter Fields

### Publishing Fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `title` | String | `"Production Docker Deployment Guide"` | Required, unique page title; 30-65 characters |
| `excerpt` | String | `"A tested Docker deployment..."` | Required meta description; 90-180 characters |
| `date` | String | `"2024-01-20"` | Required publication date (YYYY-MM-DD) |
| `updatedDate` | String | `"2024-01-22"` | Last verified update; cannot predate `date` |
| `author` | String | `"Dikshant Rai"` | Author displayed in metadata and schema |
| `readTime` | String | `"5 min read"` | Optional override; otherwise calculated at 200 words/minute |
| `tags` | Array | `["GCP", "Security"]` | 1-8 unique public navigation tags |
| `category` | String | `"Security"` | Broad engineering concern: Cloud, CI/CD, Containers, Networking, Security, Developer Tools, Observability, DevOps |
| `platform` | String | `"GCP"` | Provider/platform for filtering: GCP, AWS, Azure, Kubernetes, Docker |
| `playlist` | String | `"GCP Security Essentials"` | Optional ordered collection for a GCP, AWS, or Kubernetes article |
| `playlistOrder` | Number | `1` | Positive position in the playlist; only valid when `playlist` is set |
| `playlistOnly` | Boolean | `true` | Optional. Keep the article out of default feeds while retaining search, direct URL, sitemap, and playlist discovery |
| `difficulty` | String | `"Beginner"` | Beginner, Intermediate, or Advanced |
| `tools` | Array | `["GitHub Actions"]` | Tools covered in the article |
| `image` | String | `"/og-default.jpg"` | JPEG, PNG, or WebP social image; local file must exist |

### Frontmatter Format Rules

```yaml
---
title: "Use Quoted Production Titles with Clear Intent"
excerpt: "Describe the tested problem, implementation approach, observed result, and intended reader in 90 to 180 characters."
date: "2024-01-20"
readTime: "5 min read"
tags: ["Tag1", "Tag2", "Tag3"]
category: "CI/CD"
platform: ""
difficulty: "Intermediate"
tools: ["Jenkins", "GitHub Actions"]
---
```

**Important**:
- Must start with `---` on the first line
- Must end with `---` before content
- Use quotes for strings
- Use array format `["Item1", "Item2"]` for tags
- Date format: `YYYY-MM-DD`
- Do not add `# Heading 1` in the body; the frontmatter title is the only page H1
- Start body sections at `##`, then use `###` without skipping heading levels
- The body must contain at least 300 words; code blocks do not count toward that minimum

---

## Tags System

Tags are the primary reader-facing discovery mechanism on `/blog`. If a post has `tags: ["GCP", "Security", "Cloud Armor"]`, it appears as a normal article card in all three tag feeds. Cloud Armor is a GCP security service: use `category: "Security"`, `platform: "GCP"`, and `Cloud Armor` as a tool/tag.

Articles are standalone by default. Add `playlist` plus `playlistOrder` only when a GCP, AWS, or Kubernetes article should also belong to a separately published ordered collection at `/playlists/<playlist-slug>`:

```yaml
platform: "GCP"
tags: ["GCP", "Security", "Cloud Armor"]
playlist: "GCP Security Essentials"
playlistOrder: 1
playlistOnly: true
```

Normal playlist membership does not change how an article appears in a tag feed or search result. Set `playlistOnly: true` only for a lesson that should be discovered through its playlist or keyword search instead of the default and tag article feeds. Playlist-only articles keep their independent URL, remain in the sitemap, and are excluded from the homepage, RSS, and ordinary recommendations. Playlist posts must include the matching `GCP`, `AWS`, or `Kubernetes` platform tag. In the local `/admin` authoring tool, turn on **Add to a playlist** explicitly before entering these fields.

The blog displays tags in this order: core topics, platforms, tools and services, then development. Keep difficulty values like `Beginner` in the `difficulty` field, not in `tags`.

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
## Heading 2
### Heading 3
```

H1 is intentionally omitted because the page renderer creates it from `title`.

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
excerpt: "Deploy a first Kubernetes application with tested manifests, verification commands, observed pod state, and practical rollback guidance."
date: "2024-01-20"
readTime: "10 min read"
tags: ["Kubernetes", "DevOps", "Containers"]
category: "Containers"
platform: "Kubernetes"
difficulty: "Beginner"
tools: ["Kubernetes", "Docker"]
image: "/og-default.jpg"
---

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
- Keep titles between 30 and 65 characters
- Keep excerpts between 90 and 180 characters
- Choose relevant tags
- Use specific terminology naturally; do not repeat keywords mechanically
- Link to primary documentation for version-sensitive facts

### 3. **Read Time Estimation**
- Automatically calculated at 200 words/minute
- Can be overridden in frontmatter
- Format: `"X min read"` (e.g., "5 min read", "12 min read")

### 4. **Date Sorting**
- Posts are automatically sorted by date (newest first)
- Use consistent date format: `YYYY-MM-DD`
- Future dates are allowed (for scheduled posts)

### 5. **Content Length**
- A publishable article requires at least 300 non-code words
- Excerpts are validated at build time
- Longer content automatically gets longer read time

### 6. **Images**
- Place images in `/public/images/`
- Reference in markdown: `![Alt text](/images/my-image.png)`
- Supported formats: PNG, JPG, GIF, SVG, WebP

The frontmatter social image is stricter: use JPEG, PNG, or WebP. SVG and GIF are allowed only inside article content.

### 7. **Originality and Evidence**
- Record the cloud region, tool version, date tested, and relevant prerequisites
- Include the exact command or configuration you ran and the result you observed
- Explain failure modes, verification, rollback, cost, and security implications where relevant
- Add screenshots or redacted output only when they prove a claim
- Do not publish generated or copied instructions that you have not verified yourself
- Update `updatedDate` whenever commands or platform behavior are re-tested

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
title: "A Specific Tested DevOps Tutorial Title"
excerpt: "A specific 90-180 character description of the tested problem, implementation, result, and intended reader."
date: "2024-01-20"
readTime: "5 min read"
tags: ["Tag1", "Tag2"]
category: "DevOps"
difficulty: "Intermediate"
image: "/og-default.jpg"
---

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
