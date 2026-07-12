import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, FileText, Calendar } from "lucide-react";
import { BLOG_CATEGORIES, BLOG_DIFFICULTIES, CLOUD_PLATFORMS, DEVOPS_TOOLS, LEARNING_PATHS } from "@/config/taxonomy";
import { validateBlogDraft } from "@/lib/blogDraftValidation";

const Admin = () => {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("DevOps");
  const [platform, setPlatform] = useState("");
  const [series, setSeries] = useState("");
  const [seriesOrder, setSeriesOrder] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState("/og-default.jpg");
  const [tools, setTools] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState("");
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

  const addTool = () => {
    if (currentTool.trim() && !tools.includes(currentTool.trim())) {
      setTools([...tools, currentTool.trim()]);
      setCurrentTool("");
    }
  };

  const removeTool = (toolToRemove: string) => {
    setTools(tools.filter(tool => tool !== toolToRemove));
  };

  const applyLearningPath = (pathTitle: string) => {
    const path = LEARNING_PATHS.find(item => item.title === pathTitle);
    if (!path) return;

    setSeries(path.title);
    if (path.platform === "CI/CD") {
      setCategory("CI/CD");
      setPlatform("");
      setTags(prev => Array.from(new Set([...prev, "CI/CD", "DevOps"])));
    } else {
      setCategory("Cloud");
      setPlatform(path.platform);
      setTags(prev => Array.from(new Set([...prev, path.platform, "Cloud", "DevOps"])));
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const yamlString = (value: string) => JSON.stringify(String(value));
  const yamlList = (values: string[]) => JSON.stringify(values.map(value => value.trim()).filter(Boolean));

  const generateMarkdownFile = () => {
    const errors = validateBlogDraft({ title, excerpt, content, author, image, tags, series, seriesOrder });
    if (errors.length > 0) {
      toast({
        title: "Fix validation errors",
        description: errors.join(' '),
        variant: "destructive"
      });
      return;
    }

    const slug = generateSlug(title);
    const date = publishDate || new Date().toISOString().split('T')[0];
    const normalizedSeries = series.trim();
    const seriesFrontmatter = normalizedSeries
      ? `series: ${yamlString(normalizedSeries)}
seriesOrder: ${seriesOrder || 1}
`
      : "";
    
    const frontmatter = `---
title: ${yamlString(title)}
excerpt: ${yamlString(excerpt)}
date: ${yamlString(date)}
updatedDate: ${yamlString(date)}
author: ${yamlString(author)}
category: ${yamlString(category)}
platform: ${yamlString(platform)}
${seriesFrontmatter}difficulty: ${yamlString(difficulty)}
image: ${yamlString(image)}
tags: ${yamlList(tags)}
tools: ${yamlList(tools)}
readTime: ${yamlString(`${readTime} min read`)}
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
      title: "Blog post generated",
      description: `${slug}.md is ready for public/blog-posts/.`,
    });
  };

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setCategory("DevOps");
    setPlatform("");
    setSeries("");
    setSeriesOrder("");
    setDifficulty("Beginner");
    setPublishDate(new Date().toISOString().split('T')[0]);
    setImage("/og-default.jpg");
    setTools([]);
    setCurrentTool("");
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
                  maxLength={65}
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
              <Label>Learning Path Template</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEARNING_PATHS.map((path) => (
                  <Button
                    key={path.title}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyLearningPath(path.title)}
                  >
                    {path.title}
                  </Button>
                ))}
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
                maxLength={180}
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
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {BLOG_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Provider/Platform</option>
                  {CLOUD_PLATFORMS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {BLOG_DIFFICULTIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="series">Series (optional)</Label>
                <Input
                  id="series"
                  placeholder="Leave blank for a regular article"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seriesOrder">Day / Order</Label>
                <Input
                  id="seriesOrder"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={seriesOrder}
                  onChange={(e) => setSeriesOrder(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Hero / Social Image</Label>
              <Input
                id="image"
                placeholder="/images/blog/my-post.png"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2" data-testid="tag-badges">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          type="button"
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
              <div>
                <Label htmlFor="tools">Tools</Label>
                <div className="flex gap-2">
                  <Input
                    id="tools"
                    list="tool-options"
                    placeholder="Add a tool"
                    value={currentTool}
                    onChange={(e) => setCurrentTool(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                  />
                  <datalist id="tool-options">
                    {DEVOPS_TOOLS.map((tool) => (
                      <option key={tool} value={tool} />
                    ))}
                  </datalist>
                  <Button type="button" variant="outline" size="sm" onClick={addTool}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                        <button
                          type="button"
                          onClick={() => removeTool(tool)}
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
                <li>Run <code className="bg-muted px-1 rounded">npm run content:index</code> locally if you want to preview before building</li>
                <li>Commit and push the markdown file and any custom image assets</li>
                <li>The production build regenerates the index, sitemap, RSS feed, and article SEO shells automatically</li>
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
