import { marked } from 'marked';
import { blogPostTemplate, jsonLdTemplate } from '../content/templates.js';
import logger from './logger.js';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function markdownToHtml(markdown) {
  return marked.parse(markdown);
}

export function buildPostHtml({ title, content, metaDescription, keywords, featuredImage, jsonLd = true }) {
  logger.info('Building post HTML');

  const body = markdownToHtml(content);

  let html = blogPostTemplate({
    title,
    body,
    metaDescription,
    keywords,
    featuredImage,
  });

  if (jsonLd && metaDescription) {
    html += '\n' + jsonLdTemplate({
      title,
      description: metaDescription,
      datePublished: new Date().toISOString(),
    });
  }

  return html;
}

export function injectImages(html, images) {
  if (!images?.length) return html;

  // Insert images after the first and second H2 headings
  let insertCount = 0;
  return html.replace(/<\/h2>/gi, (match) => {
    if (insertCount < images.length) {
      const img = images[insertCount];
      insertCount++;
      const figureHtml = `
<figure>
  <img src="${img.url}" alt="${img.alt || ''}" loading="lazy" />
  ${img.credit ? `<figcaption>Photo by <a href="${img.creditUrl}" target="_blank" rel="noopener">${img.credit}</a></figcaption>` : ''}
</figure>`;
      return match + figureHtml;
    }
    return match;
  });
}
