const {
  findClientById,
  isRedirectUriAllowed,
  createSession,
  getSession,
  touchSession,
  destroySession,
  createAuthorizationCode,
  getScopesFromRequest
} = require('../services/oauth.service');
const { findUserByUsername, findUserById } = require('../config/users');

const SESSION_COOKIE_NAME = 'sid';
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL || 3600);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLogin(res, { client, error, originalQuery }) {
  const clientName = client?.name || client?.clientId || 'the application';
  res.status(200).send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Login</title>
      <style>
        body { font-family: sans-serif; margin: 2rem; background: #f5f5f5; }
        .box { max-width: 400px; margin: 0 auto; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        input[type="text"], input[type="password"] { width: 100%; padding: 0.5rem; margin-bottom: 1rem; border-radius: 4px; border: 1px solid #ccc; }
        button { padding: 0.6rem 1.2rem; border: none; border-radius: 4px; background: #2563eb; color: white; cursor: pointer; font-size: 1rem; }
        button:hover { background: #1d4ed8; }
        .error { color: #dc2626; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Sign in</h1>
        <p>Sign in to approve <strong>${escapeHtml(clientName)}</strong>'s access request.</p>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <form method="post" action="/login">
          <label for="username">Username</label>
          <input id="username" name="username" type="text" required autofocus />

          <label for="password">Password</label>
          <input id="password" name="password" type="password" required />

          <input type="hidden" name="original_query" value="${escapeHtml(
            originalQuery
          )}" />

          <button type="submit">Continue</button>
        </form>
      </div>
    </body>
  </html>`);
}

function renderConsent(res, { client, scopes, user, payload }) {
  const scopeList = scopes.map(scope => `<li>${escapeHtml(scope)}</li>`).join('');
  res.status(200).send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Authorize Application</title>
      <style>
        body { font-family: sans-serif; margin: 2rem; background: #f5f5f5; }
        .box { max-width: 480px; margin: 0 auto; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { margin-top: 0; }
        ul { padding-left: 1.2rem; }
        button { padding: 0.6rem 1.2rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; margin-right: 0.5rem; }
        .approve { background: #16a34a; color: white; }
        .approve:hover { background: #15803d; }
        .deny { background: #dc2626; color: white; }
        .deny:hover { background: #b91c1c; }
        .user { margin-bottom: 1rem; color: #374151; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Authorize ${escapeHtml(client?.name || client?.clientId)}</h1>
        <p class="user">Signed in as <strong>${escapeHtml(
          user.name || user.username
        )}</strong>.</p>
        <p>This application is requesting the following scopes:</p>
        <ul>${scopeList}</ul>
        <form method="post" action="/consent">
          <input type="hidden" name="decision" value="approve" />
          ${Object.entries(payload)
            .map(
              ([key, value]) =>
                `<input type="hidden" name="${escapeHtml(
                  key
                )}" value="${escapeHtml(value)}" />`
            )
            .join('')}
          <button type="submit" class="approve">Approve</button>
        </form>
        <form method="post" action="/consent" style="margin-top: 0.5rem;">
          ${Object.entries(payload)
            .map(
              ([key, value]) =>
                `<input type="hidden" name="${escapeHtml(
                  key
                )}" value="${escapeHtml(value)}" />`
            )
            .join('')}
          <input type="hidden" name="decision" value="deny" />
          <button type="submit" class="deny">Deny</button>
        </form>
        <form method="post" action="/logout" style="margin-top: 1.5rem;">
          <button type="submit" class="deny" style="background:#4b5563;">Sign out</button>
          ${Object.entries(payload)
            .map(
              ([key, value]) =>
                `<input type="hidden" name="${escapeHtml(
                  key
                )}" value="${escapeHtml(value)}" />`
            )
            .join('')}
        </form>
      </div>
    </body>
  </html>`);
}

function authorizationEndpoint(req, res) {
  const {
    response_type: responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  } = req.query;

  if (!responseType || responseType !== 'code') {
    return res
      .status(400)
      .json({ error: 'unsupported_response_type', error_description: 'Only response_type=code is supported.' });
  }

  const client = findClientById(clientId);
  if (!client) {
    return res
      .status(400)
      .json({ error: 'invalid_client', error_description: 'Unknown client_id' });
  }

  if (!isRedirectUriAllowed(client, redirectUri)) {
    return res
      .status(400)
      .json({ error: 'invalid_request', error_description: 'redirect_uri is not registered for this client.' });
  }

  const requestedScopes = getScopesFromRequest(scope, client);
  const originalQuery =
    req.originalUrl.includes('?') && req.originalUrl.split('?')[1]
      ? req.originalUrl.split('?')[1]
      : '';

  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sid ? getSession(sid) : null;

  if (!session) {
    return renderLogin(res, { client, originalQuery });
  }

  const user = findUserById(session.userId);
  if (!user) {
    destroySession(sid);
    return renderLogin(res, {
      client,
      originalQuery,
      error: 'Session expired. Please sign in again.'
    });
  }

  touchSession(sid);

  const payload = {
    original_query: originalQuery,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: requestedScopes.join(' '),
    state: state || '',
    code_challenge: codeChallenge || '',
    code_challenge_method: codeChallengeMethod || ''
  };

  return renderConsent(res, { client, scopes: requestedScopes, user, payload });
}

function loginHandler(req, res) {
  const { username, password, original_query: originalQuery } = req.body || {};
  const client = (() => {
    if (!originalQuery) return null;
    const params = new URLSearchParams(originalQuery);
    return findClientById(params.get('client_id'));
  })();

  if (!username || !password) {
    return renderLogin(res, {
      client,
      originalQuery,
      error: 'Username and password are required.'
    });
  }

  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return renderLogin(res, {
      client,
      originalQuery,
      error: 'Invalid credentials. Try again.'
    });
  }

  const session = createSession(user.id);
  res.cookie(SESSION_COOKIE_NAME, session.sid, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000
  });

  const redirectQuery = originalQuery || '';
  const location = redirectQuery ? `/authorize?${redirectQuery}` : '/';
  return res.redirect(location);
}

function consentHandler(req, res) {
  const {
    decision,
    original_query: originalQuery,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  } = req.body || {};

  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sid ? getSession(sid) : null;

  if (!session) {
    if (sid) destroySession(sid);
    return res.redirect(
      `/authorize${originalQuery ? `?${originalQuery}` : ''}`
    );
  }

  const client = findClientById(clientId);
  if (!client || !isRedirectUriAllowed(client, redirectUri)) {
    return res
      .status(400)
      .json({ error: 'invalid_request', error_description: 'Invalid client or redirect_uri.' });
  }

  const user = findUserById(session.userId);
  if (!user) {
    destroySession(sid);
    return res.redirect(
      `/authorize${originalQuery ? `?${originalQuery}` : ''}`
    );
  }

  touchSession(sid);

  if (decision !== 'approve') {
    const url = new URL(redirectUri);
    url.searchParams.set('error', 'access_denied');
    if (state) url.searchParams.set('state', state);
    return res.redirect(url.toString());
  }

  const scopes = scope ? scope.split(/\s+/).filter(Boolean) : client.scopes;
  const { code } = createAuthorizationCode({
    clientId,
    redirectUri,
    scope: scopes,
    userId: user.id,
    codeChallenge: codeChallenge || undefined,
    codeChallengeMethod: codeChallengeMethod || undefined
  });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  return res.redirect(redirectUrl.toString());
}

function logoutHandler(req, res) {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  if (sid) {
    destroySession(sid);
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  const { original_query: originalQuery } = req.body || {};
  return res.redirect(
    `/authorize${originalQuery ? `?${originalQuery}` : ''}`
  );
}

module.exports = {
  authorizationEndpoint,
  loginHandler,
  consentHandler,
  logoutHandler
};
