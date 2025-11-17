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
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          margin: 0; 
          padding: 2rem; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .box { 
          max-width: 400px; 
          margin: 0 auto; 
          padding: 2.5rem; 
          background: #fff; 
          border-radius: 12px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.2); 
        }
        h1 { 
          margin-top: 0; 
          color: #1f2937;
          font-size: 1.75rem;
        }
        label { 
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: 600;
          color: #374151;
        }
        input[type="text"], input[type="password"] { 
          width: 100%; 
          padding: 0.75rem; 
          margin-bottom: 1rem; 
          border-radius: 6px; 
          border: 2px solid #e5e7eb;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #2563eb;
        }
        button { 
          width: 100%;
          padding: 0.75rem 1.2rem; 
          border: none; 
          border-radius: 6px; 
          background: #2563eb; 
          color: white; 
          cursor: pointer; 
          font-size: 1rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        button:hover { background: #1d4ed8; }
        .error { 
          color: #dc2626; 
          background: #fee2e2;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border-left: 4px solid #dc2626;
        }
        .info {
          color: #4b5563;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Sign in</h1>
        <p>Sign in to approve <strong>${escapeHtml(clientName)}</strong>'s access request.</p>
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; color: #6b7280;">
          <strong>Test Users:</strong><br/>
          Username: <code>alice</code> or <code>bob</code><br/>
          Password: <code>password123</code>
        </div>
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

function renderConsent(res, { client, scopes, user, payload, justLoggedIn }) {
  const scopeList = scopes.map(scope => `<li>${escapeHtml(scope)}</li>`).join('');
  const jsPayload = JSON.stringify({
    response_type: payload.response_type || 'code',
    client_id: payload.client_id,
    redirect_uri: payload.redirect_uri,
    scope: payload.scope,
    state: payload.state
  });
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
        .notice { padding: 0.75rem; background: #d1fae5; color: #065f46; border-radius: 4px; margin-bottom: 1rem; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Authorize ${escapeHtml(client?.name || client?.clientId)}</h1>
        ${
          justLoggedIn
            ? '<div class="notice">Successfully signed in!</div>'
            : ''
        }
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
      <script>
        try {
          const payload = ${jsPayload};
          console.log('[authorize] request params', payload);
        } catch (err) {
          console.warn('Failed to log authorize payload', err);
        }
      </script>
    </body>
  </html>`);
}

function renderAuthorizationCodePage(res, { code, redirectUrl, client, scopes, state }) {
  const safeCode = escapeHtml(code);
  const safeRedirect = escapeHtml(redirectUrl);
  const safeClient = escapeHtml(client?.name || client?.clientId || 'the application');
  const stateInfo = state ? `<div class="meta"><strong>state:</strong> ${escapeHtml(state)}</div>` : '';
  const scopeList = (scopes || [])
    .map(scope => `<span class="scope">${escapeHtml(scope)}</span>`)
    .join('');
  const jsCode = JSON.stringify(code);

  res.status(200).send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Authorization Code Issued</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 2rem; background: #111827; color: #e5e7eb; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .container { background: #1f2937; padding: 2.5rem; border-radius: 16px; box-shadow: 0 20px 45px rgba(0,0,0,0.35); max-width: 560px; width: 100%; }
        h1 { margin-top: 0; color: #f9fafb; font-size: 1.75rem; }
        .client { color: #93c5fd; margin-bottom: 1rem; }
        .code-box { background: #111827; border: 1px solid #374151; border-radius: 10px; padding: 1.5rem; margin: 1.5rem 0; position: relative; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 1.1rem; letter-spacing: 0.04em; }
        .code-label { display: block; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.12em; }
        .copy-btn { position: absolute; top: 1rem; right: 1rem; background: #2563eb; color: white; border: none; border-radius: 6px; padding: 0.5rem 0.9rem; cursor: pointer; font-weight: 600; transition: background 0.2s; }
        .copy-btn:hover { background: #1d4ed8; }
        .copy-btn.copied { background: #16a34a; }
        .meta { font-size: 0.95rem; margin-bottom: 0.75rem; color: #9ca3af; }
        .scopes { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .scope { background: rgba(79, 70, 229, 0.2); color: #c7d2fe; padding: 0.35rem 0.65rem; border-radius: 9999px; font-size: 0.85rem; }
        .actions { margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; }
        .actions a, .actions button { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.4rem; border-radius: 8px; text-decoration: none; font-weight: 600; cursor: pointer; border: none; transition: background 0.2s, color 0.2s; }
        .primary { background: #2563eb; color: white; }
        .primary:hover { background: #1d4ed8; }
        .secondary { background: #374151; color: #e5e7eb; }
        .secondary:hover { background: #4b5563; }
        .helper { margin-top: 1.5rem; color: #9ca3af; font-size: 0.9rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authorization Code Ready</h1>
        <div class="client">Client: ${safeClient}</div>
        <div class="code-box">
          <span class="code-label">Authorization Code</span>
          <span id="auth-code">${safeCode}</span>
          <button id="copy-btn" class="copy-btn">Copy</button>
        </div>
        ${stateInfo}
        <div class="meta"><strong>Scopes:</strong></div>
        <div class="scopes">${scopeList}</div>
        <div class="actions">
          <a class="primary" href="${safeRedirect}">Continue to Client</a>
          <button class="secondary" id="refresh-btn">Issue New Code</button>
        </div>
        <div class="helper">
          The code is valid for a short time and can be used exactly once in a token request.
        </div>
      </div>
      <script>
        (function() {
          const copyBtn = document.getElementById('copy-btn');
          const refreshBtn = document.getElementById('refresh-btn');
          const code = ${jsCode};

          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(code);
              copyBtn.textContent = 'Copied!';
              copyBtn.classList.add('copied');
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
              }, 2000);
            } catch (err) {
              copyBtn.textContent = 'Press Ctrl+C';
            }
          });

          refreshBtn.addEventListener('click', () => {
            window.history.back();
          });
        })();
      </script>
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
    code_challenge_method: codeChallengeMethod,
    notice,
    show_code: showCodeQuery
  } = req.query;

  console.log('[/authorize] Request received:', {
    responseType: req.query.response_type,
    clientId: req.query.client_id,
    redirectUri: req.query.redirect_uri,
    scope: req.query.scope
  });

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
  const queryParams = new URLSearchParams(originalQuery);
  if (queryParams.has('notice')) {
    queryParams.delete('notice');
  }
  const sanitizedQuery = queryParams.toString();
  const showCode = showCodeQuery === 'true';

  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sid ? getSession(sid) : null;

  if (!session) {
    return renderLogin(res, { client, originalQuery: sanitizedQuery });
  }

  const user = findUserById(session.userId);
  if (!user) {
    destroySession(sid);
    return renderLogin(res, {
      client,
      originalQuery: sanitizedQuery,
      error: 'Session expired. Please sign in again.'
    });
  }

  touchSession(sid);

  const payload = {
    original_query: sanitizedQuery,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: requestedScopes.join(' '),
    state: state || '',
    code_challenge: codeChallenge || '',
    code_challenge_method: codeChallengeMethod || '',
    response_type: responseType,
    show_code: showCode ? 'true' : ''
  };

  return renderConsent(res, {
    client,
    scopes: requestedScopes,
    user,
    payload,
    justLoggedIn: Boolean(notice)
  });
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
  const base = '/authorize';
  const notice = encodeURIComponent('Successfully signed in!');
  const separator = redirectQuery.length > 0 ? '&' : '';
  const location = `${base}?${redirectQuery}${separator}notice=${notice}`.replace(
    /\?&/g,
    '?'
  );
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
    code_challenge_method: codeChallengeMethod,
    show_code: showCode
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

  if (showCode === 'true') {
    return renderAuthorizationCodePage(res, {
      code,
      redirectUrl: redirectUrl.toString(),
      client,
      scopes,
      state
    });
  }

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
