const { randomUUID } = require('crypto');
const { clients } = require('../config/oauth-config');
const { safeCompare } = require('../utils/crypto');

const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL || 3600);
const AUTH_CODE_TTL_SECONDS = Number(process.env.AUTH_CODE_TTL || 300);

const sessions = new Map(); // sid -> { userId, expiresAt }
const authorizationCodes = new Map(); // code -> { clientId, redirectUri, scope, userId, codeChallenge, codeChallengeMethod, createdAt, expiresAt }

function findClientById(clientId) {
  return clients.find(client => client.clientId === clientId);
}

function validateClientCredentials(clientId, clientSecret) {
  const client = findClientById(clientId);
  if (!client || !client.clientSecret) return null;
  if (!safeCompare(client.clientSecret, clientSecret)) return null;
  return client;
}

function isRedirectUriAllowed(client, redirectUri) {
  if (!client || !redirectUri) return false;
  return client.redirectUris.some(uri => uri === redirectUri);
}

function createSession(userId) {
  const sid = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  sessions.set(sid, { userId, expiresAt });
  return { sid, expiresAt };
}

function getSession(sid) {
  if (!sid) return null;
  const record = sessions.get(sid);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    sessions.delete(sid);
    return null;
  }
  return record;
}

function destroySession(sid) {
  if (!sid) return;
  sessions.delete(sid);
}

function touchSession(sid) {
  const record = sessions.get(sid);
  if (!record) return null;
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  record.expiresAt = expiresAt;
  sessions.set(sid, record);
  return record;
}

function createAuthorizationCode({
  clientId,
  redirectUri,
  scope,
  userId,
  codeChallenge,
  codeChallengeMethod
}) {
  const code = randomUUID();
  const expiresAt = Date.now() + AUTH_CODE_TTL_SECONDS * 1000;
  authorizationCodes.set(code, {
    clientId,
    redirectUri,
    scope,
    userId,
    codeChallenge,
    codeChallengeMethod,
    createdAt: Date.now(),
    expiresAt
  });
  return { code, expiresAt };
}

function consumeAuthorizationCode(code) {
  if (!code) return null;
  const entry = authorizationCodes.get(code);
  if (!entry) return null;
  authorizationCodes.delete(code);
  if (entry.expiresAt <= Date.now()) {
    return null;
  }
  return entry;
}

function getScopesFromRequest(requestedScopes, client) {
  const defaultScopes = client.scopes || [];
  if (!requestedScopes) return defaultScopes;
  const normalized = requestedScopes
    .split(/\s+/)
    .filter(Boolean)
    .filter(scope => defaultScopes.includes(scope));
  return normalized.length > 0 ? normalized : defaultScopes;
}

module.exports = {
  findClientById,
  validateClientCredentials,
  isRedirectUriAllowed,
  createSession,
  getSession,
  touchSession,
  destroySession,
  createAuthorizationCode,
  consumeAuthorizationCode,
  getScopesFromRequest
};
