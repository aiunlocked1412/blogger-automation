import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/default.js';
import logger from '../utils/logger.js';

function getGenAI() {
  const key = config.gemini.apiKey;
  if (!key) throw new Error('Gemini API Key not set. Please add it in Settings.');
  return new GoogleGenerativeAI(key);
}

const SYSTEM_INSTRUCTION = `You are an expert SEO blog writer. You write long-form, high-quality, SEO-optimized blog posts.

STRICT RULES — you MUST follow ALL of these:

1. **Title**: 30-60 characters MAX. Short, punchy, includes the main keyword.
2. **Content**: Write in Markdown format. MINIMUM 800 words — aim for 1000-1500 words. This is critical. Do NOT write short articles.
3. **Structure**: MUST use ## (H2) headings to break content into 4-6 sections. Use ### (H3) for sub-sections. Every section should have 2-4 paragraphs.
4. **metaDescription**: Exactly 140-160 characters. Compelling, includes main keyword.
5. **keywords**: Array of 5-8 relevant SEO keywords.
6. **labels**: Array of 2-4 category labels for the blog.
7. **Writing style**: Conversational, engaging, use examples and actionable tips. Include bullet points and numbered lists.
8. **Introduction**: Hook the reader in the first paragraph. State the problem and promise a solution.
9. **Conclusion**: Summarize key takeaways and include a call to action.
10. **Keyword placement**: Main keyword must appear in: title, first paragraph, at least 2 headings, and conclusion.

RESPOND ONLY with valid JSON in this exact format:
{
  "title": "Short SEO Title (30-60 chars)",
  "content": "Full markdown content with ## headings, minimum 800 words...",
  "metaDescription": "140-160 character description with main keyword",
  "keywords": ["main keyword", "keyword2", "keyword3", "keyword4", "keyword5"],
  "labels": ["category1", "category2"]
}`;

export async function generateContent(topic, { language = 'th', wordCount = 600, moneyUrl, variation } = {}) {
  logger.info(`Generating content for topic: ${topic}${variation ? ` (variation #${variation})` : ''}${moneyUrl ? ` (money site: ${moneyUrl})` : ''}`);

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const langInstruction = language === 'th'
    ? 'Write entirely in Thai language. Use Thai for all content, headings, and descriptions. Keywords and labels should also be in Thai (with English technical terms where appropriate).'
    : `Write in ${language} language.`;

  const moneyLinkInstruction = moneyUrl
    ? `
BACKLINK INSERTION (VERY IMPORTANT):
- You MUST insert 2-3 backlinks to this URL: ${moneyUrl}
- Insert them as natural Markdown links within relevant keywords/phrases in the content
- Example: "สามารถ[เรียนรู้เพิ่มเติมเกี่ยวกับ AI](${moneyUrl})ได้ที่นี่" or "[คอร์สเรียน AI](${moneyUrl})"
- The anchor text MUST be relevant keywords — NOT "คลิกที่นี่" or "อ่านเพิ่มเติม"
- Spread the links across different sections, not all in one place
- Make the links feel like a natural part of the content, not forced`
    : '';

  const variationInstruction = variation
    ? `\nVARIATION #${variation}: This is article variation number ${variation} on the same topic. You MUST write a COMPLETELY DIFFERENT article from other variations:
- Use a DIFFERENT angle, perspective, or sub-topic
- Use DIFFERENT examples, tips, and structure
- Use a DIFFERENT title — do NOT reuse titles
- Change the writing style slightly (e.g. more formal, more casual, listicle, how-to, comparison, beginner guide, advanced tips, case study, etc.)
- Variation ${variation} suggestions: ${['beginner guide', 'advanced tips', 'common mistakes', 'step-by-step tutorial', 'comparison/review', 'case study', 'tools & resources', 'future trends', 'FAQ style', 'checklist'][((variation - 1) % 10)]}`
    : '';

  const prompt = `Write a comprehensive, in-depth blog post about: "${topic}"

${langInstruction}
${moneyLinkInstruction}
${variationInstruction}

IMPORTANT REQUIREMENTS:
- Target word count: ${wordCount} words MINIMUM. Write a detailed article. Do not be lazy.
- Include at least 4-5 sections with ## headings
- Each section must have 2-3 detailed paragraphs with examples
- Include practical tips, real-world examples, and actionable advice
- Make the title short and catchy (30-60 characters)
- The content MUST be thorough and comprehensive — readers should feel they got real value`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    logger.error('Failed to parse AI response as JSON');
    throw new Error('AI returned invalid JSON. Raw response: ' + text.substring(0, 200));
  }

  const required = ['title', 'content', 'metaDescription', 'keywords', 'labels'];
  for (const field of required) {
    if (!parsed[field]) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  logger.info(`Content generated: "${parsed.title}" (${parsed.content.split(/\s+/).length} words, ${parsed.keywords.length} keywords)`);
  return parsed;
}

export async function generateFromOutline(outline) {
  logger.info('Generating content from outline');

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Expand this outline into a full blog post (minimum 800 words, use ## headings for each section):\n\n${outline}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
}
