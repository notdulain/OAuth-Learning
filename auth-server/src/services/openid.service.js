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
    expiresIn,
    issuer: ISSUER,
    audience: clientId
  });
}

module.exports = {
  generateIdToken
};
