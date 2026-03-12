import { google } from 'googleapis';
import config from '../../config/default.js';
import logger from '../utils/logger.js';

function getBlogId() {
  const id = config.blog.id;
  if (!id) throw new Error('No blog selected. Please select a blog in Settings.');
  return id;
}

function getBloggerClient(authClient) {
  return google.blogger({ version: 'v3', auth: authClient });
}

async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const status = err.response?.status || err.code;
      if (status === 429 || status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        logger.warn(`Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1})...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

export async function createPost(authClient, { title, content, labels = [], isDraft = false }) {
  const blogger = getBloggerClient(authClient);
  const res = await withRetry(() =>
    blogger.posts.insert({
      blogId: getBlogId(),
      isDraft,
      requestBody: { title, content, labels },
    })
  );
  logger.info(`Post created: ${res.data.title}`, { id: res.data.id, url: res.data.url });
  return res.data;
}

export async function schedulePost(authClient, { title, content, labels = [], publishDate }) {
  const blogger = getBloggerClient(authClient);

  // Create as draft first
  const draft = await withRetry(() =>
    blogger.posts.insert({
      blogId: getBlogId(),
      isDraft: true,
      requestBody: { title, content, labels },
    })
  );

  // Then publish with future date
  const res = await withRetry(() =>
    blogger.posts.publish({
      blogId: getBlogId(),
      postId: draft.data.id,
      publishDate,
    })
  );

  logger.info(`Post scheduled: ${res.data.title}`, { id: res.data.id, publishDate });
  return res.data;
}

export async function listPosts(authClient, { maxResults = 10, status } = {}) {
  const blogger = getBloggerClient(authClient);
  const params = { blogId: getBlogId(), maxResults };
  if (status) params.status = status;

  const res = await withRetry(() => blogger.posts.list(params));
  return res.data.items || [];
}

export async function getPost(authClient, postId) {
  const blogger = getBloggerClient(authClient);
  const res = await withRetry(() =>
    blogger.posts.get({ blogId: getBlogId(), postId })
  );
  return res.data;
}

export async function updatePost(authClient, postId, { title, content, labels }) {
  const blogger = getBloggerClient(authClient);
  const requestBody = {};
  if (title) requestBody.title = title;
  if (content) requestBody.content = content;
  if (labels) requestBody.labels = labels;

  const res = await withRetry(() =>
    blogger.posts.update({
      blogId: getBlogId(),
      postId,
      requestBody,
    })
  );
  logger.info(`Post updated: ${res.data.title}`, { id: postId });
  return res.data;
}

export async function deletePost(authClient, postId) {
  const blogger = getBloggerClient(authClient);
  await withRetry(() =>
    blogger.posts.delete({ blogId: getBlogId(), postId })
  );
  logger.info('Post deleted', { id: postId });
}
