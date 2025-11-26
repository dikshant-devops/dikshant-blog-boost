#!/usr/bin/env node

/**
 * Generate blog posts manifest
 * This script scans the public/blog-posts directory and creates a manifest file
 * listing all markdown files. This is needed because Vite's import.meta.glob
 * cannot access the /public folder.
 *
 * Run this script whenever you add new blog posts:
 * node scripts/generate-blog-manifest.js
 */

import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_POSTS_DIR = join(__dirname, '../public/blog-posts');
const MANIFEST_FILE = join(__dirname, '../public/blog-posts-manifest.json');

async function generateManifest() {
  try {
    console.log('Scanning blog posts directory...');
    const files = await readdir(BLOG_POSTS_DIR);

    // Filter only .md files
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    console.log(`Found ${markdownFiles.length} markdown files:`);
    markdownFiles.forEach(file => console.log(`  - ${file}`));

    // Write manifest file
    await writeFile(MANIFEST_FILE, JSON.stringify(markdownFiles, null, 2));

    console.log('\nManifest generated successfully at:', MANIFEST_FILE);
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

generateManifest();
