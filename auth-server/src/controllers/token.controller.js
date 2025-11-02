const { generateAccessToken, generateRefreshToken } = require('../services/jwt.service');

function tokenHandler(req, res, next) {
  try {
    const { grant_type: grantType, scope } = req.body;
    const client = req.oauthClient;

    if (!grantType) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'grant_type is required' });
    }

    if (grantType !== 'client_credentials') {
      return res.status(400).json({ error: 'unsupported_grant_type', error_description: 'Only client_credentials supported right now' });
    }

    const scopeValue = scope ? scope.split(/\s+/) : client.scopes;
    const accessToken = generateAccessToken({
      sub: client.clientId,
      scope: scopeValue,
      audience: client.audience || undefined,
      claims: { client: client.clientId }
    });

    const refreshToken = generateRefreshToken({
      sub: client.clientId,
      claims: { client: client.clientId }
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 15 * 60, // matches 15m default
      refresh_token: refreshToken,
      scope: Array.isArray(scopeValue) ? scopeValue.join(' ') : scopeValue
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { tokenHandler };
