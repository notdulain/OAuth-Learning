import decodeJwt from '../utils/jwt-decoder';

const AUTH_SERVER_URL =
  process.env.REACT_APP_AUTH_SERVER_URL || 'http://localhost:8085';
const TOKEN_ENDPOINT = `${AUTH_SERVER_URL.replace(/\/$/, '')}/token`;
const LOGOUT_ENDPOINT = `${AUTH_SERVER_URL.replace(/\/$/, '')}/logout`;
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || 'learning-client';
const CLIENT_SECRET =
  process.env.REACT_APP_CLIENT_SECRET || 'learning-client-secret';
const REDIRECT_URI =
  process.env.REACT_APP_REDIRECT_URI ||
  `${window.location.origin}/callback`;
const DEFAULT_SCOPES =
  process.env.REACT_APP_REQUESTED_SCOPES ||
  'read:users read:products openid profile email';
const SHOW_CODE = process.env.REACT_APP_SHOW_CODE !== 'false';

const TOKEN_STORAGE_KEY = 'oauth_tokens';
const CODE_VERIFIER_KEY = 'oauth_code_verifier';
const OAUTH_STATE_KEY = 'oauth_state';

function base64UrlEncode(buffer) {
  return btoa(
    String.fromCharCode.apply(null, new Uint8Array(buffer))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export function getStoredTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Unable to parse stored tokens', err);
    return null;
  }
}

export function storeTokens(tokens) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function storeVerifier(verifier) {
  localStorage.setItem(CODE_VERIFIER_KEY, verifier);
}

function getVerifier() {
  return localStorage.getItem(CODE_VERIFIER_KEY);
}

function clearVerifier() {
  localStorage.removeItem(CODE_VERIFIER_KEY);
}

function storeState(state) {
  localStorage.setItem(OAUTH_STATE_KEY, state);
}

function getState() {
  return localStorage.getItem(OAUTH_STATE_KEY);
}

function clearState() {
  localStorage.removeItem(OAUTH_STATE_KEY);
}

export async function initiateLogin(scopes = DEFAULT_SCOPES) {
  const codeVerifier = generateRandomString(64);
  storeVerifier(codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);
  storeState(state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  if (SHOW_CODE) {
    params.set('show_code', 'true');
  }

  const authorizeUrl = `${AUTH_SERVER_URL.replace(
    /\/$/,
    ''
  )}/authorize?${params.toString()}`;

  const popup = window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(authorizeUrl);
  }
}

async function exchangeCodeForTokens(code, codeVerifier) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
    },
    body
  });

  if (!response.ok) {
    throw new Error('Token exchange failed');
  }

  return response.json();
}

export async function handleRedirectCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  const state = params.get('state');

  if (!code && !error) {
    return { handled: false };
  }

  if (error) {
    return { handled: true, error };
  }

  const storedState = getState();
  if (storedState && state !== storedState) {
    clearState();
    clearVerifier();
    throw new Error('State mismatch');
  }

  try {
    const verifier = getVerifier();
    const tokens = await exchangeCodeForTokens(code, verifier);
    storeTokens(tokens);
    clearVerifier();
    clearState();
    window.history.replaceState({}, document.title, window.location.pathname);
    return { handled: true, tokens };
  } catch (err) {
    console.error('Failed to handle redirect', err);
    throw err;
  }
}

export async function refreshTokens() {
  const tokens = getStoredTokens();
  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    scope: DEFAULT_SCOPES
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
    },
    body
  });

  if (!response.ok) {
    throw new Error('Refresh token request failed');
  }

  const nextTokens = await response.json();
  storeTokens(nextTokens);
  return nextTokens;
}

export function getUserFromTokens(tokens = getStoredTokens()) {
  if (!tokens?.access_token) return null;
  return decodeJwt(tokens.access_token);
}

export async function logout() {
  clearTokens();
  clearVerifier();
  clearState();
  try {
    await fetch(LOGOUT_ENDPOINT, { method: 'POST', credentials: 'include' });
  } catch (err) {
    console.warn('Logout request failed', err);
  }
}

export function getAuthConfig() {
  return {
    authServerUrl: AUTH_SERVER_URL,
    tokenEndpoint: TOKEN_ENDPOINT,
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scopes: DEFAULT_SCOPES.split(' '),
    showCode: SHOW_CODE
  };
}
