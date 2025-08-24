---
title: "How to Add New Blog Posts"
excerpt: "Learn how to easily add new blog posts using markdown files"
date: "2025-01-20"
readTime: "3 min read"
tags: ["Tutorial", "Blog", "Markdown"]
---

# How to Add New Blog Posts

This is a sample markdown blog post that shows you how to create new posts for your blog.

## Adding a New Post

To add a new blog post, simply:

1. Create a new `.md` file in the `public/blog-posts/` folder
2. Add the frontmatter (metadata) at the top
3. Write your content in markdown
4. The post will automatically appear on your blog

## Frontmatter Format

Every markdown file should start with frontmatter like this:

```yaml
---
title: "Your Post Title"
excerpt: "A brief description of your post"
date: "2025-01-20"
readTime: "5 min read"
tags: ["Tag1", "Tag2", "Tag3"]
---
```

## Markdown Content

After the frontmatter, write your content using standard markdown:

- **Bold text**
- *Italic text*
- `Code snippets`
- [Links](https://example.com)

### Code Blocks

```javascript
function example() {
  console.log("This is a code block");
}
```

### Lists

1. Numbered lists
2. Are supported
3. Like this

- Bullet points
- Also work
- Great for features

## Conclusion

That's it! Your markdown files will automatically be loaded and displayed on your blog.