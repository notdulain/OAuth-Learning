const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const ISSUER = process.env.JWT_ISSUER || 'http://localhost:4000';
const DEFAULT_ACCESS_AUDIENCE =
  process.env.ACCESS_TOKEN_AUDIENCE || 'resource-server';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

function assertSecret(secret, label) {
  if (!secret) {
    throw new Error(
      `${label} is not configured. Add ${label} to your environment variables.`
    );
  }
}

assertSecret(ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET (or JWT_SECRET)');
assertSecret(REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET (or JWT_SECRET)');

function toScopeString(scope) {
  if (!scope) return undefined;
  return Array.isArray(scope) ? scope.join(' ') : scope;
}

/**
 * Issue a short-lived access token carrying authorization details.
 *
 * @param {Object} params
 * @param {string} params.sub - Subject (user or client id).
 * @param {string[]|string} [params.scope] - Allowed scopes.
 * @param {string} [params.audience] - Intended resource audience.
 * @param {Object} [params.claims] - Extra custom claims.
 * @returns {string} Signed JWT.
 */
function generateAccessToken({
  sub,
  scope,
  audience = DEFAULT_ACCESS_AUDIENCE,
  claims = {}
}) {
  if (!sub) throw new Error('generateAccessToken requires a `sub` value.');

  const payload = {
    sub,
    jti: randomUUID(),
    ...claims
  };

  const scopeValue = toScopeString(scope);
  if (scopeValue) payload.scope = scopeValue;

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    issuer: ISSUER,
    audience,
    expiresIn: ACCESS_TOKEN_TTL
  });
}

/**
 * Issue a long-lived refresh token used to obtain new access tokens.
 *
 * @param {Object} params
 * @param {string} params.sub - Subject (user or client id).
 * @param {Object} [params.claims] - Extra custom claims (avoid sensitive data).
 * @returns {string} Signed JWT.
 */
function generateRefreshToken({ sub, claims = {} }) {
  if (!sub) throw new Error('generateRefreshToken requires a `sub` value.');

  const payload = {
    sub,
    jti: randomUUID(),
    ...claims
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    issuer: ISSUER,
    expiresIn: REFRESH_TOKEN_TTL
  });
}

/**
 * Verify a JWT and return its decoded claims.
 *
 * @param {string} token - The JWT to validate.
 * @param {Object} [options]
 * @param {'access'|'refresh'} [options.type='access'] - Token category.
 * @param {string} [options.audience] - Expected audience (access tokens).
 * @returns {Object} Decoded JWT payload.
 */
function verifyToken(token, { type = 'access', audience } = {}) {
  const secret =
    type === 'refresh' ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET;

  const verifyOptions = { issuer: ISSUER };

  if (audience || type === 'access') {
    verifyOptions.audience = audience || DEFAULT_ACCESS_AUDIENCE;
  }

  return jwt.verify(token, secret, verifyOptions);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};