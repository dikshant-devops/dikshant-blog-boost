import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import About from './About';

function renderAbout() {
  return render(<BrowserRouter><About /></BrowserRouter>);
}

describe('About Page', () => {
  it('renders page heading with name', () => {
    renderAbout();
    expect(screen.getByRole('heading', { name: 'Dikshant Rai' })).toBeInTheDocument();
    expect(screen.getByText('Sr Site Reliability Engineer')).toBeInTheDocument();
    expect(screen.getByText(/I document the implementation details/)).toBeInTheDocument();
  });

  it('renders the optimized author portrait with stable dimensions', () => {
    renderAbout();
    const portrait = screen.getByRole('img', { name: 'Dikshant Rai, Sr Site Reliability Engineer' });

    expect(portrait).toHaveAttribute('src', '/images/about/dikshant-rai.jpg');
    expect(portrait).toHaveAttribute('width', '868');
    expect(portrait).toHaveAttribute('height', '1085');
    expect(portrait).toHaveAttribute('fetchpriority', 'high');
  });

  it('does not render unverifiable vanity metrics', () => {
    renderAbout();
    expect(screen.queryByText('95%')).not.toBeInTheDocument();
    expect(screen.queryByText('Students Taught')).not.toBeInTheDocument();
  });

  it('renders writing principles', () => {
    renderAbout();
    expect(screen.getByText('Production context')).toBeInTheDocument();
    expect(screen.getByText('Concrete detail')).toBeInTheDocument();
    expect(screen.getByText('Reasoned choices')).toBeInTheDocument();
  });

  it('renders all skills badges', () => {
    renderAbout();
    const expectedSkills = ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GitHub Actions', 'Terraform', 'Jenkins', 'Linux', 'Python', 'Bash'];
    expectedSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument();
    });
  });

  it('renders the technical focus', () => {
    renderAbout();
    expect(screen.getByText('Tools are context, not the lesson')).toBeInTheDocument();
  });

  it('renders CTA section with links', () => {
    renderAbout();
    expect(screen.getByText('Read the articles')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
  });

  it('CTA links point to correct routes', () => {
    renderAbout();
    const exploreLink = screen.getByText('Read the articles').closest('a');
    expect(exploreLink?.getAttribute('href')).toBe('/blog');

    const connectLink = screen.getByText('Start a conversation').closest('a');
    expect(connectLink?.getAttribute('href')).toBe('/connect');
  });
});
