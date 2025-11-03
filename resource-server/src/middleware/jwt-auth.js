const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'http://localhost:4000';
const ACCESS_TOKEN_AUDIENCE =
  process.env.ACCESS_TOKEN_AUDIENCE || 'resource-server';

function assertSecret() {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error(
      'ACCESS_TOKEN_SECRET (or JWT_SECRET) is not set. Add it to resource-server/.env'
    );
  }
}

function extractToken(header) {
  if (!header || typeof header !== 'string') return null;
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim();
}

module.exports = function jwtAuth(req, res, next) {
  assertSecret();

  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res
      .status(401)
      .json({ error: 'missing_token', error_description: 'Authorization header missing or malformed' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: JWT_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE
    });

    req.token = token;
    req.user = payload;
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: isExpired ? 'token_expired' : 'invalid_token',
      error_description: err.message
    });
  }
};
