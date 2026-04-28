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
    expect(screen.getByText('Dikshant')).toBeInTheDocument();
  });

  it('renders all achievement stats', () => {
    renderAbout();
    // 50+ appears twice (Students Taught + Tutorials Created)
    expect(screen.getAllByText('50+').length).toBe(2);
    expect(screen.getByText('6+')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders achievement labels', () => {
    renderAbout();
    expect(screen.getByText('Students Taught')).toBeInTheDocument();
    expect(screen.getByText('Tutorials Created')).toBeInTheDocument();
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Student Success Rate')).toBeInTheDocument();
  });

  it('renders all skills badges', () => {
    renderAbout();
    const expectedSkills = ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GitHub Actions', 'Terraform', 'Jenkins', 'Linux', 'Python', 'Bash'];
    expectedSkills.forEach(skill => {
      expect(screen.getByText(skill)).toBeInTheDocument();
    });
  });

  it('renders mission and background cards', () => {
    renderAbout();
    expect(screen.getByText('My Mission')).toBeInTheDocument();
    expect(screen.getByText('My Background')).toBeInTheDocument();
  });

  it('renders CTA section with links', () => {
    renderAbout();
    expect(screen.getByText('Explore Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Connect with Me')).toBeInTheDocument();
  });

  it('CTA links point to correct routes', () => {
    renderAbout();
    const exploreLink = screen.getByText('Explore Tutorials').closest('a');
    expect(exploreLink?.getAttribute('href')).toBe('/blog');

    const connectLink = screen.getByText('Connect with Me').closest('a');
    expect(connectLink?.getAttribute('href')).toBe('/connect');
  });
});
