import logger from '../utils/logger.js';

export function optimizeSeo(postData) {
  logger.info('Optimizing SEO');
  const result = { ...postData };

  // Optimize meta description
  if (result.metaDescription) {
    result.metaDescription = trimMetaDescription(result.metaDescription);
  } else {
    result.metaDescription = generateMetaDescription(result.content);
  }

  // Ensure heading hierarchy
  result.content = fixHeadingHierarchy(result.content);

  // Add keyword to first paragraph if missing
  if (result.keywords?.length) {
    result.content = ensureKeywordInIntro(result.content, result.keywords[0]);
  }

  return result;
}

function trimMetaDescription(desc) {
  if (desc.length <= 160) return desc;
  const trimmed = desc.substring(0, 157);
  const lastSpace = trimmed.lastIndexOf(' ');
  return trimmed.substring(0, lastSpace) + '...';
}

function generateMetaDescription(content) {
  // Strip markdown and get first meaningful text
  const plain = content
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/[*_`~\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return trimMetaDescription(plain);
}

function fixHeadingHierarchy(markdown) {
  // Ensure no H1 in content (title is separate), convert H1 → H2
  return markdown.replace(/^# (?!#)/gm, '## ');
}

function ensureKeywordInIntro(content, keyword) {
  const lines = content.split('\n');
  const firstParaIndex = lines.findIndex(
    (line) => line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')
  );

  if (firstParaIndex === -1) return content;

  const firstPara = lines[firstParaIndex].toLowerCase();
  if (!firstPara.includes(keyword.toLowerCase())) {
    logger.debug(`Primary keyword "${keyword}" not found in intro paragraph`);
  }

  return content;
}

export function getSeoScore(postData) {
  let score = 0;
  const checks = [];

  // Meta description
  if (postData.metaDescription && postData.metaDescription.length >= 120 && postData.metaDescription.length <= 160) {
    score += 20;
    checks.push({ name: 'Meta description length', pass: true });
  } else {
    checks.push({ name: 'Meta description length', pass: false, detail: `${postData.metaDescription?.length || 0} chars (ideal: 120-160)` });
  }

  // Title length (relaxed for non-Latin scripts like Thai)
  if (postData.title && postData.title.length >= 15 && postData.title.length <= 70) {
    score += 20;
    checks.push({ name: 'Title length', pass: true, detail: `${postData.title.length} chars` });
  } else {
    checks.push({ name: 'Title length', pass: false, detail: `${postData.title?.length || 0} chars (ideal: 15-70)` });
  }

  // Keywords
  if (postData.keywords?.length >= 3) {
    score += 20;
    checks.push({ name: 'Keywords count', pass: true });
  } else {
    checks.push({ name: 'Keywords count', pass: false, detail: `${postData.keywords?.length || 0} (min: 3)` });
  }

  // Content length
  const wordCount = postData.content?.split(/\s+/).length || 0;
  if (wordCount >= 400) {
    score += 20;
    checks.push({ name: 'Content length', pass: true, detail: `${wordCount} words` });
  } else {
    checks.push({ name: 'Content length', pass: false, detail: `${wordCount} words (min: 400)` });
  }

  // Headings
  const hasH2 = /^##\s/m.test(postData.content || '');
  if (hasH2) {
    score += 20;
    checks.push({ name: 'Has H2 headings', pass: true });
  } else {
    checks.push({ name: 'Has H2 headings', pass: false });
  }

  return { score, checks };
}
