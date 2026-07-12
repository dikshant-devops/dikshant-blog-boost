import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const shouldHide = Boolean(0);
    const shouldShow = Boolean(1);
    expect(cn('base', shouldHide && 'hidden', shouldShow && 'visible')).toBe('base visible');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles empty, undefined, and null inputs', () => {
    expect(cn('')).toBe('');
    expect(cn(undefined)).toBe('');
    expect(cn(null)).toBe('');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object inputs (clsx style)', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('deduplicates identical Tailwind classes', () => {
    // tailwind-merge deduplicates Tailwind utility classes
    expect(cn('p-4', 'p-4')).toBe('p-4');
  });
});
