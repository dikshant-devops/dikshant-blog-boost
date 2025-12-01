# Cross-Posting Automation

Automatically cross-post your blog articles to Dev.to, Medium, LinkedIn, and generate Twitter posts.

## Features

- ✅ **Dev.to**: Full article with canonical URL
- ✅ **Medium**: Full article with canonical URL  
- ✅ **LinkedIn**: Summary + link preview
- 📋 **Twitter/X**: Generated text (manual paste)
- 🔄 Automatic image path conversion
- 🎯 Platform-specific formatting
- 📝 Smart summary generation
- ⚡ Retry logic with exponential backoff
- 🎨 Beautiful CLI with progress indicators

## Setup

### 1. Install Dependencies

Dependencies are already installed if you ran `npm install` at project root.

### 2. Get API Keys

#### Dev.to
1. Go to https://dev.to/settings/extensions
2. Generate API Key
3. Add to `.env`: `DEVTO_API_KEY=your_key_here`

#### Medium
1. Go to https://medium.com/me/settings/security
2. Scroll to "Integration tokens"
3. Generate token
4. Add to `.env`: `MEDIUM_TOKEN=your_token_here`

#### LinkedIn
1. Create app at https://www.linkedin.com/developers/apps
2. Request "Share on LinkedIn" product access
3. Get OAuth2 access token (see LinkedIn setup guide below)
4. Add to `.env`:
   ```
   LINKEDIN_ACCESS_TOKEN=your_token_here
   LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID
   ```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your API keys.

## Usage

### Basic Usage

Post to all platforms (Dev.to, Medium, LinkedIn):

```bash
npm run cross-post -- --file "public/blog-posts/docker-introduction.md"
```

### Platform Selection

Post to specific platforms only:

```bash
# Dev.to only
npm run cross-post -- --file "public/blog-posts/docker.md" --platforms devto

# Dev.to and Medium
npm run cross-post -- --file "public/blog-posts/docker.md" --platforms devto,medium

# All platforms including Twitter text
npm run cross-post -- --file "public/blog-posts/docker.md" --platforms devto,medium,linkedin,twitter
```

### Dry Run

Preview without posting:

```bash
npm run cross-post -- --file "public/blog-posts/docker.md" --dry-run
```

### Skip Confirmation

Auto-confirm (useful for automation):

```bash
npm run cross-post -- --file "public/blog-posts/docker.md" --yes
```

## Options

```
-f, --file <path>              Path to markdown file (required)
-p, --platforms <platforms>    Comma-separated list (default: devto,medium,linkedin)
-d, --dry-run                  Preview without posting
-y, --yes                      Skip confirmation prompt
-h, --help                     Display help
```

## How It Works

1. **Parse Markdown**: Extracts frontmatter and content
2. **Generate Canonical URL**: Based on filename
3. **Create Summaries**: Platform-specific formats
4. **Convert Images**: Relative paths → absolute URLs
5. **Post to APIs**: With retry logic and error handling
6. **Generate Twitter**: Copy-to-clipboard ready text

## LinkedIn Setup (Detailed)

LinkedIn requires OAuth2 authentication. Here's how to get your access token:

### Option 1: Manual OAuth Flow

1. Create LinkedIn App:
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in app details
   
2. Request API Access:
   - In app settings, request "Share on LinkedIn" product
   - Wait for approval (usually instant for personal use)
   
3. Get Access Token:
   - Use OAuth2 flow to get access token
   - Token expires in 60 days
   - Store in `.env`

4. Get Person URN:
   ```bash
   curl -X GET 'https://api.linkedin.com/v2/me' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
   ```
   
   Response will include your person URN like:
   ```json
   {
     "id": "abc123xyz"
   }
   ```
   
   Your URN is: `urn:li:person:abc123xyz`

### Option 2: Use Postman

1. Import LinkedIn OAuth collection in Postman
2. Complete OAuth2 flow
3. Copy access token
4. Get person URN from `/v2/me` endpoint

## Troubleshooting

### "API key not configured"

Make sure `.env` file exists and has the correct key:

```bash
# Check .env exists
ls -la .env

# Verify contents (don't share these!)
cat .env
```

### "Failed to parse markdown"

Ensure your markdown file has required frontmatter:

```yaml
---
title: "Your Post Title"
excerpt: "Short description"
date: "2024-01-20"
tags: ["Docker", "DevOps"]
---
```

### LinkedIn Token Expired

LinkedIn tokens expire after 60 days. You'll need to:
1. Re-authorize your app
2. Get new access token
3. Update `.env`

## Examples

### Successful Run

```
🚀 Cross-Post Blog Article
──────────────────────────────────────────────────

✓ Markdown file parsed

📄 Article: Getting Started with Docker
📅 Date: 2024-01-20
🏷️  Tags: Docker, DevOps, Containers
🔗 Canonical: https://techwithdikshant.com/blog/getting-started-with-docker

📝 Summary Preview:
──────────────────────────────────────────────────
Learn Docker basics, image creation, and deployment best practices...
──────────────────────────────────────────────────

? Post to devto, medium, linkedin? Yes

✓ Posted to Dev.to: https://dev.to/techwithdikshant/getting-started-with-docker-4h3c
✓ Posted to Medium: https://medium.com/@techwithdikshant/docker-intro-abc123
✓ Posted to LinkedIn: https://linkedin.com/posts/activity-123456789

🐦 Twitter/X
──────────────────────────────────────────────────
📝 New: Getting Started with Docker

Learn container basics and deployment best practices.

🔗 techwithdikshant.com/blog/getting-started-with-docker

#DevOps #Docker #Containers #CloudNative
──────────────────────────────────────────────────
Length: 245/280 characters

✂️  Copied to clipboard!
📋 Paste at: https://twitter.com/compose/tweet

✨ Cross-Posting Complete!

📊 Results:
✅ Dev.to: https://dev.to/techwithdikshant/getting-started-with-docker-4h3c
✅ Medium: https://medium.com/@techwithdikshant/docker-intro-abc123
✅ LinkedIn: https://linkedin.com/posts/activity-123456789

🎉 Done! Your article is now live on multiple platforms.
```

## Best Practices

1. **Test First**: Always use `--dry-run` for new posts
2. **Check Previews**: Review summary before confirming
3. **Canonical URLs**: Ensure they point to your main blog
4. **Tags**: Use relevant tags that exist on each platform
5. **Images**: Use absolute URLs or relative paths from `/public/`
6. **Twitter**: Review character count before pasting

## Cost

**Total: $0/month**

All APIs used are completely free:
- Dev.to: Free, unlimited
- Medium: Free, unlimited
- LinkedIn: Free (with OAuth2 setup)
- Twitter: Manual paste (no API cost)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review `.env.example` for correct format
3. Test with `--dry-run` flag
4. Check API documentation links in this README

## Security

- Never commit `.env` file (already in `.gitignore`)
- Keep API keys private
- Rotate keys if accidentally exposed
- Use environment variables in production

## Future Enhancements

Potential additions:
- GitHub Actions automation
- Hashnode support
- Substack support
- Scheduled posting
- Analytics tracking
- Image upload to CDN
- Tweet threading for long summaries
