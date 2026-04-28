import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Admin from './Admin';

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
    expect(screen.getByLabelText('Read Time (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Content (Markdown)')).toBeInTheDocument();
  });

  it('has default author value "Dikshant Sharma"', () => {
    render(<Admin />);
    const authorInput = screen.getByLabelText('Author') as HTMLInputElement;
    expect(authorInput.value).toBe('Dikshant Sharma');
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

      expect(screen.getByText('Docker')).toBeInTheDocument();
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

      const dockerBadges = screen.getAllByText('Docker');
      expect(dockerBadges.length).toBe(1);
    });

    it('does not add empty/whitespace tags', () => {
      render(<Admin />);
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: '   ' } });
      fireEvent.click(getTagAddButton());

      // No tag badges should appear (only the "Add a tag" input exists)
      const badges = document.querySelectorAll('.flex.flex-wrap.gap-2.mt-2');
      expect(badges.length).toBe(0);
    });

    it('removes a tag when X button is clicked', () => {
      render(<Admin />);
      fireEvent.change(screen.getByPlaceholderText('Add a tag'), { target: { value: 'Docker' } });
      fireEvent.click(getTagAddButton());

      expect(screen.getByText('Docker')).toBeInTheDocument();

      // The X button is inside the badge, next to the text
      const dockerText = screen.getByText('Docker');
      const removeBtn = dockerText.parentElement!.querySelector('button')!;
      fireEvent.click(removeBtn);

      expect(screen.queryByText('Docker')).not.toBeInTheDocument();
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
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Getting Started with Docker!' } });
      fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: '# Docker Guide' } });
      fireEvent.click(screen.getByText('Generate Blog Post'));

      expect(downloadFilename).toBe('getting-started-with-docker.md');
      expect(mockClick).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('generated'),
      }));

      vi.restoreAllMocks();
    });
  });

  it('renders instructions section', () => {
    render(<Admin />);
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText('How to publish your blog post:')).toBeInTheDocument();
  });
});
