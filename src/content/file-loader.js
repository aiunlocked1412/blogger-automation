import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import matter from 'gray-matter';
import logger from '../utils/logger.js';

export async function loadFile(filePath) {
  const ext = extname(filePath).toLowerCase();

  if (ext === '.md' || ext === '.markdown') {
    return loadMarkdown(filePath);
  }
  if (ext === '.json') {
    return loadJSON(filePath);
  }

  throw new Error(`Unsupported file type: ${ext}. Use .md or .json`);
}

async function loadMarkdown(filePath) {
  logger.info(`Loading Markdown: ${filePath}`);
  const raw = await readFile(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  return {
    title: frontmatter.title || extractFirstHeading(content) || 'Untitled',
    content,
    metaDescription: frontmatter.description || frontmatter.metaDescription || '',
    keywords: frontmatter.keywords || frontmatter.tags || [],
    labels: frontmatter.labels || frontmatter.categories || frontmatter.tags || [],
    publishDate: frontmatter.date || frontmatter.publishDate || null,
    isDraft: frontmatter.draft === true,
    ...frontmatter,
  };
}

async function loadJSON(filePath) {
  logger.info(`Loading JSON: ${filePath}`);
  const raw = await readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.title || !data.content) {
    throw new Error('JSON file must contain at least "title" and "content" fields');
  }

  return {
    metaDescription: '',
    keywords: [],
    labels: [],
    ...data,
  };
}

function extractFirstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
