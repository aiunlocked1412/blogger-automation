export function blogPostTemplate({ title, body, metaDescription, keywords, featuredImage }) {
  const imageHtml = featuredImage
    ? `<figure class="featured-image">
  <img src="${featuredImage.url}" alt="${featuredImage.alt || title}" loading="lazy" />
  ${featuredImage.credit ? `<figcaption>Photo by <a href="${featuredImage.creditUrl}" target="_blank" rel="noopener">${featuredImage.credit}</a></figcaption>` : ''}
</figure>`
    : '';

  return `${imageHtml}
<article class="blog-post">
${body}
</article>

<!--more-->
${metaDescription ? `<meta name="description" content="${escapeAttr(metaDescription)}" />` : ''}
${keywords?.length ? `<meta name="keywords" content="${escapeAttr(keywords.join(', '))}" />` : ''}`;
}

export function jsonLdTemplate({ title, description, datePublished, author = 'Blog Author', url }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished,
    author: { '@type': 'Person', name: author },
    ...(url && { url }),
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
