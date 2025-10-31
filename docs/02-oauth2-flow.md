# OAuth 2.0 Flows

This phase is about turning abstract security specs into running code. Focus on understanding the actors, endpoints, and token lifecycles so you can wire the authorization server, resource server, and client app together.

## Core Concepts

- **Resource Owner**: The end user granting access.
- **Client**: The application requesting access on behalf of the user (your React app).
- **Authorization Server**: Issues tokens (your `auth-server`).
- **Resource Server**: Hosts protected APIs (your `resource-server`).
- **Scopes**: Named permissions such as `read:users` or `write:products`.
- **Grants**: Credential exchange patterns (Authorization Code, Client Credentials, etc.).
- **Tokens**: Access tokens, refresh tokens, and later OIDC ID tokens.

## Endpoints You Need

| Endpoint | Method | Purpose | Implemented In |
|----------|--------|---------|----------------|
| `/authorize` | `GET` | Start user authorization, return code | `auth-server/src/routes/auth.routes.js` |
| `/token` | `POST` | Exchange code or credentials for tokens | `auth-server/src/routes/token.routes.js` |
| `/revoke` | `POST` | Invalidate refresh tokens | (optional for Phase 3) |
| `/introspect` | `POST` | Validate tokens (for WSO2 or other clients) | (later phase) |

Every flow uses some combination of these endpoints.

## Authorization Code Flow (with PKCE later)

1. React app redirects to `/authorize` with `response_type=code`, `client_id`, `redirect_uri`, and `scope`.
2. Auth server authenticates the user (`/login` form) and captures consent.
3. Auth server issues a short-lived authorization code and redirects back to the client.
4. Client POSTs the code to `/token` along with its secret (or PKCE verifier).
5. Auth server responds with access and refresh tokens.
6. Client stores tokens securely (memory + `httpOnly` cookie or secure storage).

Your implementation steps:

- Generate authorization codes (e.g., `auth-server/src/services/oauth.service.js`).
- Persist them briefly (in-memory store is fine while learning).
- Validate redirect URIs and code reuse.

## Client Credentials Flow

Used for machine-to-machine calls (no user, just service accounts).

1. Backend client authenticates using `client_id` + `client_secret`.
2. Sends `grant_type=client_credentials` to `/token`.
3. Receives access token limited to machine scopes (e.g., `internal:metrics`).
4. Calls the resource server with the token.

Implementation notes:

- Store hashed client secrets (consider `bcrypt`).
- Issue JWTs that include clear `sub` and `scope` claims.
- Restrict refresh token issuance—these flows usually do **not** get refresh tokens.

## Refresh Token Flow

Access tokens are short-lived. Refresh tokens let clients renew without user interaction.

1. Client stores the long-lived refresh token securely.
2. When the access token expires, send `grant_type=refresh_token` to `/token`.
3. Validate token, rotation policy, and reuse detection.
4. Issue a new access token (and optionally a new refresh token).

Decide on rotation:

- **Rotating** (recommended): Issue a new refresh token and invalidate the previous one.
- **Non-rotating**: Keep the same refresh token but enforce revocation lists.

## Other Grants (Know Them Even If You Do Not Implement Yet)

- **Authorization Code with PKCE**: Required for public clients (mobile, SPA). Add code verifier/challenge to mitigate interception.
- **Device Authorization Grant**: For devices without browsers. Users complete auth on a second device.
- **Resource Owner Password Credentials**: Legacy grant—avoid in new designs, but reading the spec helps spot anti-patterns.

## Token Design Considerations

- **Access token lifetime**: 5–15 minutes is common.
- **Refresh token lifetime**: Hours, days, or “sliding” lifetime with rotation.
- **Scopes**: Start with `read:users`, `read:products`, and extend as features demand.
- **Audience (`aud`)**: Set to `resource-server` to help resource server validate tokens.
- **Issuer (`iss`)**: Base URL of your auth server (e.g., `http://localhost:4000`).
- **Subject (`sub`)**: Unique identifier for the user or client.

## Security Essentials

- Always validate `redirect_uri` against a whitelist to stop open redirect attacks.
- Bind authorization codes to the original client (`client_id`) and redirect URI.
- Use HTTPS (even in dev) or at least `localhost` loopback exceptions for OAuth.
- Log every grant exchange so you can debug Postman vs. browser behavior later.

## Implementation Checklist

- [ ] Define OAuth configuration in `auth-server/src/config/oauth-config.js` (clients, scopes, redirect URIs).
- [ ] Build controller logic for `/authorize` and `/token`.
- [ ] Implement `validate-client` middleware to authenticate clients.
- [ ] Persist authorization codes and refresh tokens (in-memory store or lightweight database).
- [ ] Extend Postman collection with Authorization Code and Client Credentials scripts.
- [ ] Document which scopes protect each API route in the resource server.

> **Looking Ahead:** When you integrate WSO2, these same flows are orchestrated by the gateway. Getting them solid locally first makes the enterprise configuration much easier to reason about.
