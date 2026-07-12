import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import matter from 'gray-matter';
import Admin from './Admin';
import { validateBlogDraft } from '@/lib/blogDraftValidation';

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Helper: find the tag add button (the small button right after the tags input)
function getTagAddButton() {
  const tagInput = screen.getByPlaceholderText('Add a tag');
  // The input and button are siblings inside a flex container
  const flexParent = tagInput.parentElement!;
  const button = flexParent.querySelector('button');
  return button!;
}

function getToolAddButton() {
  return screen.getByPlaceholderText('Add a tool').parentElement!.querySelector('button')!;
}

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

const validBody = `## Tested Implementation\n\n${Array.from({ length: 310 }, () => 'evidence').join(' ')}`;
const validExcerpt = 'A tested production implementation with exact commands, observed results, validation checks, operational context, and rollback guidance.';

function fillValidDraft(title: string) {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: validExcerpt } });
  fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: validBody } });
  fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'DevOps' } });
  fireEvent.click(getTagAddButton());
}

describe('Admin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(<Admin />);
    expect(screen.getByText('Blog Post Creator')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<Admin />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument();
    expect(screen.queryByLabelText('Read Time (minutes)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Content (Markdown)')).toBeInTheDocument();
  });

  it('has default author value "Dikshant Rai"', () => {
    render(<Admin />);
    const authorInput = screen.getByLabelText('Author') as HTMLInputElement;
    expect(authorInput.value).toBe('Dikshant Rai');
  });

  describe('generate button state', () => {
    it('is disabled when title and content are empty', () => {
      render(<Admin />);
      const generateBtn = screen.getByText('Generate Blog Post');
      expect(generateBtn.closest('button')).toBeDisabled();
    });

    it('is disabled when only title is filled', () => {
      render(<Admin />);
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Title' } });
      expect(screen.getByText('Generate Blog Post').closest('button')).toBeDisabled();
    });

    it('is enabled when title and content are filled', () => {
      render(<Admin />);
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Title' } });
      fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: 'Some content' } });
      expect(screen.getByText('Generate Blog Post').closest('button')).not.toBeDisabled();
    });
  });

  describe('tag management', () => {
    it('adds a tag when add button is clicked', () => {
      render(<Admin />);
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());

      expect(within(screen.getByTestId('tag-badges')).getByText('Docker')).toBeInTheDocument();
    });

    it('clears tag input after adding', () => {
      render(<Admin />);
      const tagInput = screen.getByPlaceholderText('Add a tag') as HTMLInputElement;
      fireEvent.change(tagInput, { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());

      expect(tagInput.value).toBe('');
    });

    it('does not add duplicate tags', () => {
      render(<Admin />);
      const tagInput = screen.getByPlaceholderText('Add a tag');

      fireEvent.change(tagInput, { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());
      fireEvent.change(tagInput, { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());

      const dockerBadges = within(screen.getByTestId('tag-badges')).getAllByText('Docker');
      expect(dockerBadges.length).toBe(1);
    });

    it('does not add empty/whitespace tags', () => {
      render(<Admin />);
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: '   ' } });
      fireEvent.click(getTagAddButton());

      // No tag badges should appear (only the "Add a tag" input exists)
      expect(screen.queryByTestId('tag-badges')).not.toBeInTheDocument();
    });

    it('removes a tag when X button is clicked', () => {
      render(<Admin />);
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());

      expect(within(screen.getByTestId('tag-badges')).getByText('Docker')).toBeInTheDocument();

      // The X button is inside the badge, next to the text
      const dockerText = within(screen.getByTestId('tag-badges')).getByText('Docker');
      const removeBtn = dockerText.parentElement!.querySelector('button')!;
      fireEvent.click(removeBtn);

      expect(screen.queryByTestId('tag-badges')).not.toBeInTheDocument();
    });
  });

  describe('reset form', () => {
    it('clears all fields when reset is clicked', () => {
      render(<Admin />);

      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Title' } });
      fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: 'My Excerpt' } });
      fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: 'Content' } });

      fireEvent.click(screen.getByText('Reset Form'));

      expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Excerpt') as HTMLTextAreaElement).value).toBe('');
      expect((screen.getByLabelText('Content (Markdown)') as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('markdown file generation', () => {
    it('triggers file download with correct slug', () => {
      // Track the download anchor
      let downloadFilename = '';
      const mockClick = vi.fn();

      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
        const el = origCreateElement(tag, options);
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: mockClick, writable: true });
          const origDescriptor = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'download');
          Object.defineProperty(el, 'download', {
            set(val) { downloadFilename = val; origDescriptor?.set?.call(this, val); },
            get() { return downloadFilename; },
          });
        }
        return el;
      });

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });

      render(<Admin />);
      fillValidDraft('Getting Started with Docker in Production');
      fireEvent.click(screen.getByText('Generate Blog Post'));

      expect(downloadFilename).toBe('getting-started-with-docker-in-production.md');
      expect(mockClick).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('generated'),
      }));

      vi.restoreAllMocks();
    });

    it('omits playlist metadata for a standalone article', async () => {
      const mockClick = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
        const el = origCreateElement(tag, options);
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: mockClick, writable: true });
        }
        return el;
      });

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockRevokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });

      render(<Admin />);
      fillValidDraft('Standalone Google Cloud IAM Implementation');
      fireEvent.click(screen.getByText('Generate Blog Post'));

      const generatedBlob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const generatedMarkdown = await readBlobAsText(generatedBlob);

      expect(generatedMarkdown).not.toContain('playlist:');
      expect(generatedMarkdown).not.toContain('playlistOrder:');
      expect(mockClick).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('adds playlist metadata only after explicit opt-in', async () => {
      const mockClick = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
        const el = origCreateElement(tag, options);
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: mockClick, writable: true });
        }
        return el;
      });

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: vi.fn() });

      render(<Admin />);
      fillValidDraft('Production Google Cloud Security Policy Guide');
      fireEvent.change(screen.getByLabelText('Platform'), { target: { value: 'GCP' } });
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'GCP' } });
      fireEvent.click(getTagAddButton());
      fireEvent.click(screen.getByRole('switch', { name: 'Add to a playlist' }));
      fireEvent.change(screen.getByLabelText('Playlist name'), { target: { value: 'Production GCP Security' } });
      fireEvent.change(screen.getByLabelText('Position'), { target: { value: '3' } });
      fireEvent.click(screen.getByRole('switch', { name: 'Playlist-only discovery' }));
      fireEvent.click(screen.getByText('Generate Blog Post'));

      const generatedMarkdown = await readBlobAsText(mockCreateObjectURL.mock.calls[0][0] as Blob);
      const parsed = matter(generatedMarkdown).data;

      expect(parsed.playlist).toBe('Production GCP Security');
      expect(parsed.playlistOrder).toBe(3);
      expect(parsed.playlistOnly).toBe(true);
      expect(mockClick).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('generates valid YAML when free-text metadata contains quotes', async () => {
      const mockClick = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
        const el = origCreateElement(tag, options);
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: mockClick, writable: true });
        }
        return el;
      });

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: vi.fn() });

      render(<Admin />);
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Production "Quoted" Infrastructure Guide' } });
      fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: `${validExcerpt}\nLine "two"` } });
      fireEvent.change(screen.getByLabelText('Hero / Social Image'), { target: { value: '/images/"quoted".png' } });
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'Security "Advanced"' } });
      fireEvent.click(getTagAddButton());
      fireEvent.change(screen.getByPlaceholderText('Add a tool'), { target: { value: 'Terraform "Cloud"' } });
      fireEvent.click(getToolAddButton());
      fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: validBody } });
      fireEvent.click(screen.getByText('Generate Blog Post'));

      const generatedMarkdown = await readBlobAsText(mockCreateObjectURL.mock.calls[0][0] as Blob);
      const parsed = matter(generatedMarkdown).data;

      expect(parsed.title).toBe('Production "Quoted" Infrastructure Guide');
      expect(parsed.excerpt).toBe(`${validExcerpt}\nLine "two"`);
      expect(parsed.image).toBe('/images/"quoted".png');
      expect(parsed.tags).toEqual(['Security "Advanced"']);
      expect(parsed.tools).toEqual(['Terraform "Cloud"']);

      vi.restoreAllMocks();
    });
  });

  it('rejects drafts that would fail the production content build', () => {
    const errors = validateBlogDraft({
      title: 'Short title',
      excerpt: 'Short excerpt',
      content: '# Duplicate title\n\nThin body',
      author: '',
      image: '/logo.svg',
      tags: [],
      platform: 'Azure',
      playlist: 'GCP Day by Day',
      playlistOrder: '0',
      playlistOnly: false
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('30-65'),
      expect.stringContaining('90-180'),
      expect.stringContaining('Author'),
      expect.stringContaining('1 and 8'),
      expect.stringContaining('JPEG'),
      expect.stringContaining('H1'),
      expect.stringContaining('300'),
      expect.stringContaining('positive integer')
    ]));
  });

  it('renders instructions section', () => {
    render(<Admin />);
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText('How to publish your blog post:')).toBeInTheDocument();
  });
});
