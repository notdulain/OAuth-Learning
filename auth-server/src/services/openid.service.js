const jwt = require('jsonwebtoken');
const { findUserById } = require('../config/users');

const ID_TOKEN_SECRET =
  process.env.ID_TOKEN_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET;
const ISSUER = process.env.JWT_ISSUER || 'http://localhost:4000';

function assertSecret() {
  if (!ID_TOKEN_SECRET) {
    throw new Error(
      'ID token secret missing. Set ID_TOKEN_SECRET or reuse ACCESS_TOKEN_SECRET.'
    );
  }
}

function buildClaims(user, clientId, overrides = {}) {
  return {
    iss: ISSUER,
    aud: clientId,
    sub: user.id,
    name: user.name,
    preferred_username: user.username,
    email: user.email,
    email_verified: true,
    ...overrides
  };
}

function generateIdToken({ userId, clientId, expiresIn = '15m', authTime }) {
  assertSecret();
  const user = findUserById(userId);
  if (!user) {
    throw new Error('Cannot issue ID token for unknown user');
  }
  const payload = buildClaims(user, clientId, {
    auth_time: authTime || Math.floor(Date.now() / 1000)
  });
  return jwt.sign(payload, ID_TOKEN_SECRET, {
    expiresIn
  });
}

function getUserInfo(userId, scopeString = '') {
  const user = findUserById(userId);
  if (!user) return null;

  const scopes = scopeString.split(/\s+/).filter(Boolean);
  const baseClaims = {
    sub: user.id,
    name: user.name,
    preferred_username: user.username
  };

  if (scopes.includes('email')) {
    baseClaims.email = user.email;
    baseClaims.email_verified = true;
  }

  if (scopes.includes('profile')) {
    baseClaims.family_name = user.name.split(' ').slice(-1)[0];
    baseClaims.given_name = user.name.split(' ').slice(0, -1).join(' ');
  }

  return baseClaims;
}

module.exports = {
  generateIdToken,
  getUserInfo,
  buildClaims
};
