import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Terms from './Terms';

describe('Terms page', () => {
  it('sets clear expectations for technical examples and acceptable use', () => {
    render(<MemoryRouter><Terms /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Terms of use' })).toBeInTheDocument();
    expect(screen.getByText(/test in a non-production environment/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acceptable use' })).toBeInTheDocument();
  });
});
