# OpenID Connect Layer

OpenID Connect (OIDC) sits on top of OAuth 2.0 and gives you a standardized identity layer. In Phase 4 you will extend the same authorization server with ID tokens, discovery metadata, and standardized user info responses.

## Why OIDC Matters

- OAuth 2.0 by itself does **authorization** (who can access an API).
- OpenID Connect adds **authentication** (who the user is).
- Consumers such as SPAs, mobile apps, and gateways expect OIDC-compliant metadata so they can auto-configure login flows.

## New Building Blocks

| Component | Description | File(s) to implement |
|-----------|-------------|----------------------|
| **ID Token** | JWT representing user authentication event | `auth-server/src/services/openid.service.js` |
| **UserInfo Endpoint** | REST endpoint returning profile claims | `auth-server/src/routes/auth.routes.js` (or dedicated route) |
| **Discovery Document** | `/.well-known/openid-configuration` metadata for clients | `auth-server/src/services/openid.service.js` |
| **JWKS** | JSON Web Key Set for public signing keys | `auth-server/src/routes/.well-known` (to add) |

## ID Token Essentials

- **Format**: JWT signed with the same key material as access tokens (HS256 or RS256).
- **Audience (`aud`)**: The client application ID.
- **Issuer (`iss`)**: Your auth server base URL (`http://localhost:4000` in dev).
- **Subject (`sub`)**: Stable user identifier (e.g., UUID).
- **Authentication time (`auth_time`)**: Timestamp when the user logged in.
- **Nonce**: Optional but required for browser-based implicit flows to prevent replay.

Sample payload:

```json
{
  "iss": "http://localhost:4000",
  "sub": "user_123",
  "aud": "client_spa",
  "exp": 1730400000,
  "iat": 1730396400,
  "auth_time": 1730396400,
  "email": "learner@example.com",
  "given_name": "OAuth",
  "family_name": "Student"
}
```

## Discovery Document Checklist

Expose `GET /.well-known/openid-configuration` with JSON similar to:

```json
{
  "issuer": "http://localhost:4000",
  "authorization_endpoint": "http://localhost:4000/authorize",
  "token_endpoint": "http://localhost:4000/token",
  "userinfo_endpoint": "http://localhost:4000/userinfo",
  "jwks_uri": "http://localhost:4000/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "scopes_supported": ["openid", "profile", "email", "read:users"],
  "claims_supported": ["sub", "aud", "email", "given_name", "family_name"]
}
```

Clients (including WSO2) read this document to auto-configure login screens and signature validation.

## UserInfo Endpoint

- Requires a **valid access token** (with `openid` scope) in the `Authorization` header.
- Returns a JSON payload containing user claims permitted by scopes:

```json
{
  "sub": "user_123",
  "name": "OAuth Student",
  "email": "learner@example.com",
  "email_verified": true,
  "preferred_username": "oauth.student"
}
```

Implement scope filtering: only return `email` if the access token has `email` scope, etc.

## Claims & Scopes Mapping

| Scope | Standard Claims | Custom Claims |
|-------|-----------------|---------------|
| `openid` | `sub` | — |
| `profile` | `name`, `preferred_username`, `given_name`, `family_name` | `roles` (if needed) |
| `email` | `email`, `email_verified` | — |
| `read:users` | — | `permissions` array for API access |

Keep claims minimal—only include data the client actually needs.

## Key Management & JWKS

- Generate signing keys (HS256 shared secret or RS256 key pair).
- Publish the **public** key(s) via `/.well-known/jwks.json`.
- Rotate keys periodically; keep old keys available until tokens signed with them expire.
- Update `jwt-verify.js` to fetch and cache JWKS keys when you move to distributed setups.

## Session Management Notes

- Browsers maintain a login session (cookie) with the authorization server.
- When the React app calls `/authorize` again, the server can silently issue new codes if the session is still valid (SSO).
- Implement logout by clearing the session cookie and revoking refresh tokens.

## Implementation Checklist

- [ ] Add `openid`, `profile`, and `email` scopes to the OAuth config.
- [ ] Implement ID token generation in `openid.service.js`.
- [ ] Update `/token` controller to append `id_token` when `openid` scope is requested.
- [ ] Create routes for discovery, JWKS, and UserInfo endpoints.
- [ ] Extend Postman collection with requests to `/userinfo` and discovery endpoints.
- [ ] Update client app to decode ID token and display claims (e.g., `TokenDisplay.jsx`).

> **Tip:** Keep OIDC responses deterministic—having predictable claims makes debugging WSO2 JWT validation far easier later.
