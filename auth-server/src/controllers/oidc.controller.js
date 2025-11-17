const jwt = require('jsonwebtoken');
const { getUserInfo } = require('../services/openid.service');

const ISSUER = process.env.JWT_ISSUER || 'http://localhost:4000';
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || ISSUER;
const ROUTE_BASE = process.env.OIDC_ROUTE_BASE || '';
const ACCESS_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'secret';

const jwk = {
  kty: 'oct',
  use: 'sig',
  k: Buffer.from(ACCESS_SECRET).toString('base64'),
  kid: 'shared-secret',
  alg: 'HS256'
};

function discoveryDocument(req, res) {
  const issuer = ISSUER.replace(/\/$/, '');
  const base = AUTH_SERVER_URL.replace(/\/$/, '');
  const url = path => `${base}${ROUTE_BASE}${path}`;

  res.json({
    issuer,
    authorization_endpoint: url('/authorize'),
    token_endpoint: url('/token'),
    userinfo_endpoint: url('/userinfo'),
    jwks_uri: url('/.well-known/jwks.json'),
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'read:users',
      'read:products'
    ],
    token_endpoint_auth_methods_supported: ['client_secret_basic'],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'auth_time',
      'name',
      'preferred_username',
      'email',
      'email_verified'
    ],
    code_challenge_methods_supported: ['S256', 'plain']
  });
}

function jwksHandler(req, res) {
  res.json({
    keys: [jwk]
  });
}

function userInfoHandler(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'invalid_token', error_description: 'Missing token' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, ACCESS_SECRET, {
      issuer: ISSUER
    });

    if (!payload.scope || !payload.scope.includes('openid')) {
      return res
        .status(403)
        .json({ error: 'insufficient_scope', error_description: 'openid scope required' });
    }

    const claims = getUserInfo(payload.sub, payload.scope);
    if (!claims) {
      return res
        .status(404)
        .json({ error: 'not_found', error_description: 'User not found' });
    }

    return res.json(claims);
  } catch (err) {
    console.error('UserInfo token verification failed', err);
    return res.status(401).json({
      error: 'invalid_token',
      error_description: err.message
    });
  }
}

module.exports = {
  discoveryDocument,
  jwksHandler,
  userInfoHandler
};
