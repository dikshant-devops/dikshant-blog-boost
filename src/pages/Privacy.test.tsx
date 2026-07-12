import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import Privacy from './Privacy';

describe('Privacy page', () => {
  it('discloses every active form and security processor', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeInTheDocument();
    expect(screen.getAllByText(/Beehiiv/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Cloudflare hosts/)).toBeInTheDocument();
    expect(screen.getByText(/storage of contact-form submissions/)).toBeInTheDocument();
    expect(screen.getByText(/does not currently include an advertising network/)).toBeInTheDocument();
  });
});
