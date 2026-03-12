import config from '../../config/default.js';
import logger from '../utils/logger.js';

export async function searchImages(query, { count = 2 } = {}) {
  logger.info(`Searching images for: "${query}"`);

  // Try Unsplash first
  if (config.images.unsplash.accessKey) {
    try {
      return await searchUnsplash(query, count);
    } catch (err) {
      logger.warn(`Unsplash failed: ${err.message}, trying Pexels...`);
    }
  }

  // Fallback to Pexels
  if (config.images.pexels.apiKey) {
    try {
      return await searchPexels(query, count);
    } catch (err) {
      logger.warn(`Pexels failed: ${err.message}`);
    }
  }

  logger.warn('No image API configured or all failed');
  return [];
}

async function searchUnsplash(query, count) {
  const url = new URL(`${config.images.unsplash.baseUrl}/search/photos`);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', count);
  url.searchParams.set('orientation', 'landscape');

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${config.images.unsplash.accessKey}` },
  });

  if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);

  const data = await res.json();
  return data.results.map((photo) => ({
    url: photo.urls.regular,
    alt: photo.alt_description || query,
    credit: photo.user.name,
    creditUrl: `${photo.user.links.html}?utm_source=blogger_automation&utm_medium=referral`,
    source: 'unsplash',
  }));
}

async function searchPexels(query, count) {
  const url = new URL(`${config.images.pexels.baseUrl}/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', count);
  url.searchParams.set('orientation', 'landscape');

  const res = await fetch(url, {
    headers: { Authorization: config.images.pexels.apiKey },
  });

  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

  const data = await res.json();
  return data.photos.map((photo) => ({
    url: photo.src.large,
    alt: photo.alt || query,
    credit: photo.photographer,
    creditUrl: photo.photographer_url,
    source: 'pexels',
  }));
}
