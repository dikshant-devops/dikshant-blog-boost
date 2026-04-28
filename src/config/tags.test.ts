import { describe, it, expect } from 'vitest';
import { TAG_CONFIGS, getAllTags, getTagConfig } from './tags';

describe('TAG_CONFIGS', () => {
  it('contains expected core tags', () => {
    const expectedTags = ['Docker', 'Kubernetes', 'Git', 'GitHub', 'CI/CD', 'Cloud', 'DevOps'];
    expectedTags.forEach(tag => {
      expect(TAG_CONFIGS[tag]).toBeDefined();
    });
  });

  it('each tag has a name matching its key', () => {
    Object.entries(TAG_CONFIGS).forEach(([key, config]) => {
      expect(config.name).toBe(key);
    });
  });

  it('each tag has a description', () => {
    Object.values(TAG_CONFIGS).forEach(config => {
      expect(config.description).toBeTruthy();
    });
  });
});

describe('getAllTags', () => {
  it('returns all tags as an array', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(Object.keys(TAG_CONFIGS).length);
  });

  it('each returned tag has a name', () => {
    getAllTags().forEach(tag => {
      expect(tag.name).toBeTruthy();
    });
  });
});

describe('getTagConfig', () => {
  it('returns config for known tag', () => {
    const config = getTagConfig('Docker');
    expect(config).toBeDefined();
    expect(config?.name).toBe('Docker');
  });

  it('returns undefined for unknown tag', () => {
    expect(getTagConfig('NonExistentTag')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getTagConfig('docker')).toBeUndefined();
    expect(getTagConfig('Docker')).toBeDefined();
  });
});
