import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { google } from 'googleapis';
import config, { saveSettings, getSettings } from '../../config/default.js';
import { authenticate, isAuthenticated, getAuthUrl, exchangeCode, disconnect } from '../auth/google-auth.js';
import * as bloggerApi from '../blogger/blogger-api.js';
import { generateContent } from '../content/ai-generator.js';
import { loadFile } from '../content/file-loader.js';
import { optimizeSeo, getSeoScore } from '../seo/seo-optimizer.js';
import { searchImages } from '../images/image-service.js';
import { buildPostHtml, injectImages } from '../utils/html-builder.js';
import { parseScheduleDate, formatScheduleInfo } from '../scheduler/scheduler.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Cache auth client
let authClient = null;

async function getAuth() {
  if (!authClient) {
    const authed = await isAuthenticated();
    if (!authed) {
      throw new Error('Not authenticated. Please connect your Google account in Settings.');
    }
    authClient = await authenticate();
  }
  return authClient;
}

// ─── Settings API ───

app.get('/api/settings', (req, res) => {
  const s = getSettings();
  // Mask secrets for display
  res.json({
    blogId: s.blogId || '',
    googleClientId: s.googleClientId || '',
    googleClientSecret: s.googleClientSecret ? '••••' + s.googleClientSecret.slice(-4) : '',
    googleClientSecretSet: !!s.googleClientSecret,
    geminiApiKey: s.geminiApiKey ? '••••' + s.geminiApiKey.slice(-4) : '',
    geminiApiKeySet: !!s.geminiApiKey,
    unsplashAccessKey: s.unsplashAccessKey ? '••••' + s.unsplashAccessKey.slice(-4) : '',
    unsplashAccessKeySet: !!s.unsplashAccessKey,
    pexelsApiKey: s.pexelsApiKey ? '••••' + s.pexelsApiKey.slice(-4) : '',
    pexelsApiKeySet: !!s.pexelsApiKey,
  });
});

app.post('/api/settings', (req, res) => {
  try {
    const { blogId, googleClientId, googleClientSecret, geminiApiKey, unsplashAccessKey, pexelsApiKey } = req.body;
    const updates = {};

    if (blogId !== undefined) updates.blogId = blogId;
    if (googleClientId !== undefined) updates.googleClientId = googleClientId;
    if (googleClientSecret && googleClientSecret !== '••••') updates.googleClientSecret = googleClientSecret;
    if (geminiApiKey && geminiApiKey !== '••••') updates.geminiApiKey = geminiApiKey;
    if (unsplashAccessKey && unsplashAccessKey !== '••••') updates.unsplashAccessKey = unsplashAccessKey;
    if (pexelsApiKey && pexelsApiKey !== '••••') updates.pexelsApiKey = pexelsApiKey;

    saveSettings(updates);
    // Reset auth client so it picks up new creds
    authClient = null;
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auth API ───

app.get('/api/auth/status', async (req, res) => {
  try {
    const authed = await isAuthenticated();
    const s = getSettings();
    res.json({
      authenticated: authed,
      configured: !!(s.googleClientId && s.googleClientSecret),
      blogSelected: !!s.blogId,
    });
  } catch {
    res.json({ authenticated: false, configured: false });
  }
});

// Start OAuth — redirect user to Google consent
app.get('/api/auth/connect', (req, res) => {
  try {
    const s = getSettings();
    if (!s.googleClientId || !s.googleClientSecret) {
      return res.status(400).json({ error: 'Please save Google Client ID and Secret in Settings first' });
    }
    const redirectUri = `http://localhost:${PORT}/oauth2callback`;
    saveSettings({ googleRedirectUri: redirectUri });
    const url = getAuthUrl({ redirectUri });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OAuth callback from Google
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send('<h1>Error: No authorization code</h1>');
    }

    const redirectUri = `http://localhost:${PORT}/oauth2callback`;
    authClient = await exchangeCode(code, { redirectUri });

    // Redirect back to app with success
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Connected!</title></head>
      <body style="background:#0f1117;color:#e4e6ed;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">&#10003;</div>
          <h1 style="color:#00b894;">Connected Successfully!</h1>
          <p style="color:#9399ad;">Google account linked. You can close this tab.</p>
          <script>setTimeout(()=>window.close(), 2000); window.opener && window.opener.postMessage('oauth-success','*');</script>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error('OAuth callback error:', err);
    res.status(500).send(`
      <html><body style="background:#0f1117;color:#e17055;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1>Connection Failed</h1>
          <p>${err.message}</p>
          <p style="color:#9399ad;">Please close this tab and try again.</p>
        </div>
      </body></html>
    `);
  }
});

// Disconnect
app.post('/api/auth/disconnect', async (req, res) => {
  try {
    await disconnect();
    authClient = null;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List user's blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const auth = await getAuth();
    const blogger = google.blogger({ version: 'v3', auth });
    const result = await blogger.blogs.listByUser({ userId: 'self' });
    const blogs = (result.data.items || []).map(b => ({
      id: b.id,
      name: b.name,
      url: b.url,
      posts: b.posts?.totalItems || 0,
    }));
    res.json({ blogs });
  } catch (err) {
    logger.error('List blogs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Select a blog
app.post('/api/blogs/select', (req, res) => {
  try {
    const { blogId, blogName } = req.body;
    if (!blogId) return res.status(400).json({ error: 'blogId is required' });
    saveSettings({ blogId, blogName });
    res.json({ success: true, blogId, blogName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Content API ───

app.post('/api/generate', async (req, res) => {
  try {
    const { topic, language = 'th', wordCount = 600, moneyUrl, variation } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    let postData = await generateContent(topic, { language, wordCount, moneyUrl, variation });
    postData = optimizeSeo(postData);
    const seo = getSeoScore(postData);

    res.json({ ...postData, seo });
  } catch (err) {
    logger.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/post', async (req, res) => {
  try {
    const auth = await getAuth();
    const { title, content, labels = [], metaDescription, keywords, isDraft = false, skipImages = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let images = [];
    if (!skipImages) {
      const query = keywords?.[0] || title;
      images = await searchImages(query);
    }

    let html = buildPostHtml({ title, content, metaDescription, keywords, featuredImage: images[0] });
    if (images.length > 1) html = injectImages(html, images.slice(1));

    const result = await bloggerApi.createPost(auth, { title, content: html, labels, isDraft });
    res.json({ success: true, post: result, images: images.length });
  } catch (err) {
    logger.error('Post error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const auth = await getAuth();
    const { title, content, labels = [], metaDescription, keywords, publishDate, skipImages = false } = req.body;

    if (!title || !content || !publishDate) {
      return res.status(400).json({ error: 'Title, content, and publishDate are required' });
    }

    const isoDate = parseScheduleDate(publishDate);
    const scheduleInfo = formatScheduleInfo(isoDate);

    let images = [];
    if (!skipImages) images = await searchImages(keywords?.[0] || title);

    let html = buildPostHtml({ title, content, metaDescription, keywords, featuredImage: images[0] });
    if (images.length > 1) html = injectImages(html, images.slice(1));

    const result = await bloggerApi.schedulePost(auth, { title, content: html, labels, publishDate: isoDate });
    res.json({ success: true, post: result, schedule: scheduleInfo });
  } catch (err) {
    logger.error('Schedule error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const auth = await getAuth();
    const maxResults = parseInt(req.query.count) || 10;
    const posts = await bloggerApi.listPosts(auth, { maxResults });
    res.json({ posts });
  } catch (err) {
    logger.error('List error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/drafts', async (req, res) => {
  try {
    const auth = await getAuth();
    const posts = await bloggerApi.listPosts(auth, { status: ['DRAFT'] });
    res.json({ posts });
  } catch (err) {
    logger.error('Drafts error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const auth = await getAuth();
    await bloggerApi.deletePost(auth, req.params.id);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seo/check', (req, res) => {
  try {
    const { title, content, metaDescription, keywords } = req.body;
    const seo = getSeoScore({ title, content, metaDescription, keywords });
    res.json(seo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Blogger Automation Web UI`);
  console.log(`   http://localhost:${PORT}\n`);
});
