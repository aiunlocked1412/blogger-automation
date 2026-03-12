import { OAuth2Client } from 'google-auth-library';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import config from '../../config/default.js';
import logger from '../utils/logger.js';

const TOKEN_PATH = config.paths.tokens;

// Read config live (so saved settings are picked up)
function getGoogleConfig() {
  return config.google;
}

function createOAuth2Client(overrides = {}) {
  const g = getGoogleConfig();
  return new OAuth2Client(
    overrides.clientId || g.clientId,
    overrides.clientSecret || g.clientSecret,
    overrides.redirectUri || g.redirectUri
  );
}

async function loadTokens() {
  try {
    const data = await readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveTokens(tokens) {
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  logger.info('Tokens saved');
}

export async function authenticate(overrides = {}) {
  const oauth2Client = createOAuth2Client(overrides);
  const tokens = await loadTokens();

  if (tokens) {
    oauth2Client.setCredentials(tokens);

    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      logger.info('Token expired, refreshing...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await saveTokens(credentials);
        oauth2Client.setCredentials(credentials);
      } catch (err) {
        logger.warn('Token refresh failed', { error: err.message });
        throw new Error('Token expired and refresh failed. Please re-connect.');
      }
    }

    logger.info('Authenticated with saved tokens');
    return oauth2Client;
  }

  throw new Error('No tokens found. Please connect your Google account first.');
}

// Generate the OAuth URL (for web-based flow)
export function getAuthUrl(overrides = {}) {
  const g = getGoogleConfig();
  const oauth2Client = createOAuth2Client(overrides);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: g.scopes,
    prompt: 'consent',
  });
}

// Exchange code for tokens (callback from Google)
export async function exchangeCode(code, overrides = {}) {
  const oauth2Client = createOAuth2Client(overrides);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveTokens(tokens);
  logger.info('OAuth code exchanged, tokens saved');
  return oauth2Client;
}

export async function isAuthenticated() {
  const tokens = await loadTokens();
  return tokens !== null;
}

export async function disconnect() {
  try {
    await writeFile(TOKEN_PATH, '');
    const { unlink } = await import('node:fs/promises');
    await unlink(TOKEN_PATH);
  } catch { /* ignore */ }
  logger.info('Disconnected — tokens removed');
}
