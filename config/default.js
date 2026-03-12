import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(__dirname, '..', 'data', 'settings.json');

// Load saved settings from data/settings.json (overrides .env)
function loadSettings() {
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
  const current = loadSettings();
  const merged = { ...current, ...settings };
  writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2));
  // Hot-reload into config
  Object.assign(config, buildConfig(merged));
  return merged;
}

export function getSettings() {
  return loadSettings();
}

function buildConfig(s = {}) {
  return {
    blog: {
      id: s.blogId || process.env.BLOG_ID,
    },
    google: {
      clientId: s.googleClientId || process.env.GOOGLE_CLIENT_ID,
      clientSecret: s.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: s.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/oauth2callback',
      scopes: ['https://www.googleapis.com/auth/blogger'],
    },
    gemini: {
      apiKey: s.geminiApiKey || process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash-lite',
    },
    images: {
      unsplash: {
        accessKey: s.unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY,
        baseUrl: 'https://api.unsplash.com',
      },
      pexels: {
        apiKey: s.pexelsApiKey || process.env.PEXELS_API_KEY,
        baseUrl: 'https://api.pexels.com/v1',
      },
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
    paths: {
      tokens: join(__dirname, '..', 'data', 'tokens.json'),
      settings: SETTINGS_PATH,
      content: join(__dirname, '..', 'content'),
      templates: join(__dirname, '..', 'templates'),
    },
  };
}

const settings = loadSettings();
const config = buildConfig(settings);
export default config;
