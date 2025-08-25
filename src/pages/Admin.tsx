import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, FileText, Calendar } from "lucide-react";

const Admin = () => {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [author, setAuthor] = useState("Dikshant Sharma");
  const [readTime, setReadTime] = useState("5");
  const { toast } = useToast();

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateMarkdownFile = () => {
    const slug = generateSlug(title);
    const date = new Date().toISOString().split('T')[0];
    
    const frontmatter = `---
title: "${title}"
excerpt: "${excerpt}"
date: "${date}"
author: "${author}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
readTime: "${readTime} min read"
---

${content}`;

    // Create a downloadable file
    const blob = new Blob([frontmatter], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Blog post generated! 📝",
      description: `${slug}.md has been downloaded. Upload it to your public/blog-posts/ directory.`,
    });
  };

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setTags([]);
    setCurrentTag("");
    setReadTime("5");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Blog Post Creator</h1>
          <p className="text-muted-foreground">
            Create new blog posts using markdown. The generated file can be uploaded to your repository.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              New Blog Post
            </CardTitle>
            <CardDescription>
              Fill in the details below to generate a markdown file for your blog post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter blog post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Author name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description of the blog post (2-3 sentences)"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  placeholder="5"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                placeholder="Write your blog post content using markdown syntax..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use markdown syntax like **bold**, *italic*, `code`, ## headings, etc.
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={generateMarkdownFile}
                disabled={!title || !content}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Generate Blog Post
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How to publish your blog post:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Fill in all the required fields above</li>
                <li>Click "Generate Blog Post" to download the markdown file</li>
                <li>Upload the file to the <code className="bg-muted px-1 rounded">public/blog-posts/</code> directory in your repository</li>
                <li>Commit and push the changes to your repository</li>
                <li>The blog post will automatically appear on your website</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Markdown formatting tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>## Heading</code> for section headings</li>
                <li><code>**Bold text**</code> for emphasis</li>
                <li><code>`code`</code> for inline code</li>
                <li><code>```language</code> for code blocks</li>
                <li><code>[Link text](URL)</code> for links</li>
                <li><code>![Alt text](image-url)</code> for images</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;