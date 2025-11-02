const { validateClientCredentials } = require('../services/oauth.service');

function extractBasicCredentials(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) return null;

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const [clientId, clientSecret] = decoded.split(':');
  return { clientId, clientSecret };
}

module.exports = function validateClient(req, res, next) {
  let clientId = req.body.client_id;
  let clientSecret = req.body.client_secret;

  if (!clientId || !clientSecret) {
    const basic = extractBasicCredentials(req);
    if (basic) {
      clientId = basic.clientId;
      clientSecret = basic.clientSecret;
    }
  }

  if (!clientId || !clientSecret) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Client credentials missing' });
  }

  const client = validateClientCredentials(clientId, clientSecret);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Client authentication failed' });
  }

  req.oauthClient = client;
  next();
};
