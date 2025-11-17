const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} = require('../services/jwt.service');
const { generateIdToken } = require('../services/openid.service');
const { findUserById } = require('../config/users');
const {
  consumeAuthorizationCode
} = require('../services/oauth.service');

function toScopeArray(scope, fallback = []) {
  if (!scope) return fallback;
  if (Array.isArray(scope)) return scope;
  return scope
    .split(/\s+/)
    .filter(Boolean);
}

function parseTtlSeconds(ttl = process.env.ACCESS_TOKEN_TTL || '15m') {
  const match = /^(\d+)([smhd]?)$/i.exec(ttl);
  if (!match) return 900;
  const value = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return value;
  }
}

function verifyPkce(codeChallenge, method, codeVerifier) {
  if (!codeChallenge) return true;
  if (!codeVerifier) return false;

  if (!method || method.toLowerCase() === 'plain') {
    return codeChallenge === codeVerifier;
  }

  if (method.toUpperCase() === 'S256') {
    const hashed = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    return hashed === codeChallenge;
  }

  return false;
}

function buildTokenResponse({
  accessToken,
  refreshToken,
  scope,
  idToken
}) {
  const response = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: parseTtlSeconds(),
    scope: Array.isArray(scope) ? scope.join(' ') : scope
  };

  if (refreshToken) {
    response.refresh_token = refreshToken;
  }

  if (idToken) {
    response.id_token = idToken;
  }

  return response;
}

function includesOpenId(scope) {
  const scopes = toScopeArray(scope);
  return scopes.includes('openid');
}

function handleClientCredentials(req, res) {
  const { scope } = req.body;
  const client = req.oauthClient;
  const requestedScopes = toScopeArray(scope, client.scopes || []);

  const accessToken = generateAccessToken({
    sub: client.clientId,
    scope: requestedScopes,
    audience: client.audience || undefined,
    claims: { client: client.clientId, grant: 'client_credentials' }
  });

  return res.json(
    buildTokenResponse({
      accessToken,
      scope: requestedScopes
    })
  );
}

function handleAuthorizationCode(req, res) {
  const {
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  } = req.body || {};
  const client = req.oauthClient;

  if (!code) {
    return res
      .status(400)
      .json({ error: 'invalid_request', error_description: 'code is required' });
  }

  const authCode = consumeAuthorizationCode(code);
  if (!authCode) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' });
  }

  if (authCode.clientId !== client.clientId) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'Authorization code does not belong to this client' });
  }

  if (authCode.redirectUri !== redirectUri) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
  }

  if (
    !verifyPkce(
      authCode.codeChallenge,
      authCode.codeChallengeMethod,
      codeVerifier
    )
  ) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
  }

  const user = findUserById(authCode.userId);
  if (!user) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'User no longer exists' });
  }

  const authTime = Math.floor((authCode.createdAt || Date.now()) / 1000);
  const accessToken = generateAccessToken({
    sub: user.id,
    scope: authCode.scope,
    claims: {
      client: client.clientId,
      username: user.username,
      name: user.name,
      email: user.email,
      grant: 'authorization_code'
    }
  });

  const refreshToken = generateRefreshToken({
    sub: user.id,
    claims: {
      client: client.clientId,
      scope: authCode.scope.join(' '),
      grant: 'authorization_code',
      auth_time: authTime
    }
  });

  let idToken;
  if (includesOpenId(authCode.scope)) {
    idToken = generateIdToken({
      userId: user.id,
      clientId: client.clientId,
      authTime
    });
  }

  return res.json(
    buildTokenResponse({
      accessToken,
      refreshToken,
      scope: authCode.scope,
      idToken
    })
  );
}

function handleRefreshToken(req, res) {
  const { refresh_token: refreshToken, scope: requestedScope } = req.body || {};
  const client = req.oauthClient;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ error: 'invalid_request', error_description: 'refresh_token is required' });
  }

  let decoded;
  try {
    decoded = verifyToken(refreshToken, { type: 'refresh' });
  } catch (err) {
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'refresh_token is invalid or expired'
    });
  }

  if (decoded.client && decoded.client !== client.clientId) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'refresh_token was not issued to this client' });
  }

  const user = findUserById(decoded.sub);
  if (!user) {
    return res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'User linked to refresh token no longer exists' });
  }

  const originalScopes = toScopeArray(
    decoded.scope,
    client.scopes || []
  );

  const scopesToIssue = requestedScope
    ? toScopeArray(requestedScope).filter(scope =>
        originalScopes.includes(scope)
      )
    : originalScopes;

  const accessToken = generateAccessToken({
    sub: user.id,
    scope: scopesToIssue,
    claims: {
      client: client.clientId,
      username: user.username,
      name: user.name,
      email: user.email,
      grant: 'refresh_token'
    }
  });

  const nextRefreshToken = generateRefreshToken({
    sub: user.id,
    claims: {
      client: client.clientId,
      scope: scopesToIssue.join(' '),
      grant: 'refresh_token',
      auth_time: decoded.auth_time || Math.floor(Date.now() / 1000)
    }
  });

  let idToken;
  if (includesOpenId(scopesToIssue)) {
    idToken = generateIdToken({
      userId: user.id,
      clientId: client.clientId,
      authTime: decoded.auth_time || Math.floor(Date.now() / 1000)
    });
  }

  return res.json(
    buildTokenResponse({
      accessToken,
      refreshToken: nextRefreshToken,
      scope: scopesToIssue,
      idToken
    })
  );
}

function tokenHandler(req, res, next) {
  try {
    const { grant_type: grantType } = req.body || {};

    if (!grantType) {
      return res
        .status(400)
        .json({ error: 'invalid_request', error_description: 'grant_type is required' });
    }

    switch (grantType) {
      case 'client_credentials':
        return handleClientCredentials(req, res);
      case 'authorization_code':
        return handleAuthorizationCode(req, res);
      case 'refresh_token':
        return handleRefreshToken(req, res);
      default:
        return res
          .status(400)
          .json({ error: 'unsupported_grant_type', error_description: `${grantType} is not supported` });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { tokenHandler };
