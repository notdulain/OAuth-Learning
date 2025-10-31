# JSON Web Tokens (JWT)

JSON Web Tokens give you a compact, URL-safe way to transmit claims between the authorization server and resource server. Understanding how they are packaged, signed, and validated is critical for Phase 2 (JWT) and beyond.

## Token Anatomy

A JWT has three base64url-encoded segments separated by dots:

```
xxxxx.yyyyy.zzzzz
```

| Segment | Name | Contents | Example |
|---------|------|----------|---------|
| 1 | Header | Metadata describing the token | `{"alg":"RS256","typ":"JWT"}` |
| 2 | Payload | Claims about the subject and context | `{"sub":"user_123","scope":"read:users"}` |
| 3 | Signature | Cryptographic signature over header + payload | `RS256(HMACSHA256(header.payload, key))` |

### Example Access Token

```json
// Header
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "rsa-key-2024-10-31"
}

// Payload
{
  "iss": "http://localhost:4000",
  "sub": "user_123",
  "aud": "resource-server",
  "exp": 1730400000,
  "iat": 1730396400,
  "scope": "read:users read:products"
}
```

### Signature Math (Conceptually)

```
signature = Sign(privateKey, base64url(header) + "." + base64url(payload))
```

The resource server verifies the signature using the shared secret (HS256) or the public key (RS256).

## Standard Claims Cheat Sheet

| Claim | Purpose | Required? |
|-------|---------|-----------|
| `iss` | Issuer identifier (auth server origin) | Recommended |
| `sub` | Subject identifier (user or client) | Recommended |
| `aud` | Intended audience (resource server) | Recommended |
| `exp` | Expiration time (Unix seconds) | Required |
| `iat` | Issued-at time | Recommended |
| `nbf` | Not-before time (optional) | Optional |
| `jti` | Unique token ID (helps with revocation) | Optional |
| `scope` / `scp` | Space-separated scopes | Custom usage |

Use additional claims (`roles`, `tenant`, etc.) sparingly to avoid bloated tokens.

## Token Types in This Project

- **Access Token**: Sent to resource server; short-lived (minutes). Stored in memory or HTTP-only cookies.
- **Refresh Token**: Exchanged for new access tokens; longer-lived (hours+). Keep server-side tracking for rotation and revocation.
- **ID Token**: Added in Phase 4; describes user identity, not API permissions.

## Signing Algorithms

| Algorithm | Type | Use Case | Notes |
|-----------|------|----------|-------|
| `HS256` | Symmetric (HMAC + SHA-256) | Simple setups where auth and resource servers share a secret | Rotate secrets regularly; keep them long and random. |
| `RS256` | Asymmetric (RSA + SHA-256) | Recommended once services run on separate hosts or with WSO2 | Publish JWKS so clients can verify signatures. |
| `ES256` | Asymmetric (ECDSA + SHA-256) | Lighter keys, better for mobile/IoT | Requires extra libraries (`jose`). |

Start with HS256 for local learning, then experiment with RS256 to match WSO2 expectations.

## Validation Workflow

1. Parse token from `Authorization: Bearer <token>`.
2. Verify structure (three segments, base64url semantics).
3. Look up signing key (HS secret or JWKS).
4. Validate signature.
5. Check `iss`, `aud`, `exp`, `nbf`, and other claims.
6. Enforce scopes/roles for the requested resource.
7. (Optional) Check against revocation store (`jti` blacklist, refresh token rotation).

Any failure should result in `401 Unauthorized` or `403 Forbidden` with a descriptive error body.

## Storage Best Practices

- **Servers**: Treat tokens like passwords; never log full values. Mask them in logs (`abc...xyz`).
- **Browsers**: Prefer HTTP-only cookies or memory storage with refresh tokens in secure cookies.
- **Mobile**: Use platform-secure storage (Keychain/Keystore).
- **Revocation lists**: Maintain a short-lived in-memory blacklist for rotated refresh tokens if you cannot rotate immediately.

## Debugging Tips

- Use [jwt.io](https://jwt.io) or the built-in `TokenDisplay.jsx` component to inspect tokens.
- Check the `kid` header if verification fails—maybe the wrong key is being used.
- Compare server clock drift (`iat`, `exp`) when you see `token is not yet valid` errors.
- Record token hashes instead of plain tokens when storing them server-side.

## Implementation Checklist

- [ ] Implement `generateAccessToken`, `generateRefreshToken`, and `verifyToken` in `auth-server/src/services/jwt.service.js`.
- [ ] Configure secrets/keys via `.env` (HS256 secret or RS256 key paths).
- [ ] Update `resource-server/src/middleware/jwt-auth.js` to call `verifyToken`.
- [ ] Add scope-based authorization in `resource-server/src/middleware/scope-check.js`.
- [ ] Add tests or Postman scripts that simulate expired tokens and invalid signatures.
- [ ] Document token lifetimes in `docs/02-oauth2-flow.md` and keep them in sync with code.

> **Remember:** JWTs are bearer tokens—anyone holding a valid token can use it. Always secure transport (HTTPS) and storage.
