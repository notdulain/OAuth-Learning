# OpenID Connect - Adding Identity to OAuth

OpenID Connect (OIDC) is OAuth 2.0 with a user profile attached. It answers the question: "Who is this person?" while OAuth answers: "What can they access?"

## The Key Difference

**OAuth 2.0**: "You can access these APIs"
- Gives you an access token to call APIs
- Focuses on **authorization** (permissions)

**OpenID Connect**: "You are John Doe (john@example.com)"
- Gives you an ID token with user information
- Focuses on **authentication** (identity)

**Real-World Analogy:**
- **OAuth**: Like a parking pass - it lets you park, but doesn't say who you are
- **OIDC**: Like a driver's license - it proves who you are AND lets you drive

## What OIDC Adds to OAuth

OIDC adds three new things on top of OAuth:

1. **ID Token**: A special token containing user information
2. **UserInfo Endpoint**: An API to get more user details
3. **Standard Discovery**: A way for apps to auto-configure themselves

## Understanding the ID Token

An ID token is a JWT that describes who logged in. Think of it as a digital ID card.

### ID Token Example:

```json
{
  "iss": "http://localhost:4000",              // Who issued this ID
  "sub": "user_123",                            // Unique user identifier
  "aud": "my-react-app",                        // Which app this is for
  "exp": 1730400000,                            // Expiration time
  "iat": 1730396400,                            // Issued at time
  "auth_time": 1730396400,                      // When user logged in
  "email": "john@example.com",                  // User's email
  "email_verified": true,                       // Email is confirmed
  "name": "John Doe",                           // Full name
  "given_name": "John",                         // First name
  "family_name": "Doe"                          // Last name
}
```

### ID Token vs Access Token

| Feature | ID Token | Access Token |
|---------|----------|--------------|
| **Purpose** | Identify the user | Access APIs |
| **Audience** | The client app | The resource server |
| **Contains** | User profile info | Permissions/scopes |
| **Used by** | Frontend app | Backend API |
| **Verified by** | Client app | Resource server |

**Simple Rule**: 
- Use **ID token** to display user info (name, email) in your app
- Use **access token** to call APIs

## The Three New OpenID Scopes

When requesting tokens, add these special scopes:

```
openid          → Required! Tells server to return an ID token
profile         → Get name, username, picture, etc.
email           → Get email and email_verified
```

### What Each Scope Returns:

**openid scope:**
```json
{
  "sub": "user_123"  // Just the user ID
}
```

**openid + profile scope:**
```json
{
  "sub": "user_123",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "preferred_username": "johndoe",
  "picture": "https://example.com/photo.jpg"
}
```

**openid + email scope:**
```json
{
  "sub": "user_123",
  "email": "john@example.com",
  "email_verified": true
}
```

## The Complete OIDC Flow

Here's how it works when a user logs in:

```
1. User clicks "Login with Google" (or your auth server)
   ↓
2. React app redirects to authorization endpoint:
   /authorize?
     response_type=code
     &client_id=my-react-app
     &scope=openid profile email
     &redirect_uri=http://localhost:3000/callback
   ↓
3. User logs in and approves permissions
   ↓
4. Auth server redirects back with code:
   /callback?code=ABC123
   ↓
5. React app exchanges code for tokens:
   POST /token
   {
     grant_type: "authorization_code",
     code: "ABC123"
   }
   ↓
6. Auth server returns THREE tokens:
   {
     access_token: "eyJ...",      // For calling APIs
     refresh_token: "def...",     // For getting new tokens
     id_token: "ghk..."          // User identity info ← NEW!
   }
   ↓
7. React app decodes ID token and displays:
   "Welcome, John Doe!"
```

## The UserInfo Endpoint

Sometimes the ID token doesn't have all the info you need. Use the UserInfo endpoint to get more:

### Request:
```http
GET /userinfo
Authorization: Bearer <access_token>
```

### Response:
```json
{
  "sub": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified": true,
  "preferred_username": "johndoe",
  "picture": "https://example.com/photo.jpg",
  "roles": ["user", "admin"]  // Custom claim
}
```

**When to use UserInfo:**
- ID token is too big with all claims
- You want real-time data (ID token is cached)
- You need sensitive info not suitable for ID token

## Discovery Document - Auto-Configuration

The discovery document is like a map that tells apps where everything is. It's always at:

```
/.well-known/openid-configuration
```

### What It Contains:

```json
{
  "issuer": "http://localhost:4000",
  "authorization_endpoint": "http://localhost:4000/authorize",
  "token_endpoint": "http://localhost:4000/token",
  "userinfo_endpoint": "http://localhost:4000/userinfo",
  "jwks_uri": "http://localhost:4000/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "scopes_supported": [
    "openid",
    "profile",
    "email",
    "read:users"
  ],
  "claims_supported": [
    "sub",
    "email",
    "name",
    "given_name",
    "family_name"
  ]
}
```

**Why it's useful:**
- Apps can auto-configure themselves
- No hard-coded URLs
- Works with libraries like Passport.js
- WSO2 reads this to validate your tokens

## JWKS - Public Key Publishing

JWKS (JSON Web Key Set) is where you publish your public signing keys so others can verify your tokens.

### JWKS Endpoint:
```
GET /.well-known/jwks.json
```

### JWKS Response:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "rsa-key-2024",
      "n": "0vx7agoebG...",  // Public key modulus
      "e": "AQAB"            // Public key exponent
    }
  ]
}
```

**Think of it like:**
- Your auth server has a private key (kept secret) to sign tokens
- Anyone can use the public key (from JWKS) to verify signatures
- Like how anyone can verify a wax seal, but only you can create it

## Claims and Scope Mapping

Map scopes to claims so you only return what was requested:

| Scope | Claims Included |
|-------|-----------------|
| `openid` | `sub` only |
| `profile` | `name`, `given_name`, `family_name`, `preferred_username`, `picture` |
| `email` | `email`, `email_verified` |
| `read:users` | (custom - for API access, not user profile) |

### Implementation Example:

```javascript
function buildIdToken(user, scopes) {
  const claims = {
    iss: 'http://localhost:4000',
    sub: user.id,
    aud: clientId,
    exp: Date.now() + 3600,
    iat: Date.now()
  };

  // Only add profile claims if requested
  if (scopes.includes('profile')) {
    claims.name = user.name;
    claims.given_name = user.firstName;
    claims.family_name = user.lastName;
  }

  // Only add email claims if requested
  if (scopes.includes('email')) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified;
  }

  return signJWT(claims);
}
```

## Single Sign-On (SSO) with OIDC

One of the coolest features of OIDC is SSO - log in once, access multiple apps.

### How It Works:

1. User logs into App A → Session created on auth server
2. User visits App B → App B redirects to auth server
3. Auth server sees existing session → Auto-approves (no login needed)
4. User is instantly logged into App B

### Session Management:

The auth server maintains a session cookie:
```http
Set-Cookie: auth_session=abc123; HttpOnly; Secure; SameSite=Lax
```

When the user comes back, the server recognizes them and skips the login page.

## Implementation Checklist

### Step 1: Add OpenID Scopes
Update your OAuth config:

```javascript
// auth-server/src/config/oauth-config.js
scopes: {
  'openid': 'OpenID Connect authentication',
  'profile': 'Access to profile information',
  'email': 'Access to email address',
  'read:users': 'Read user data from API'
}
```

### Step 2: Generate ID Tokens
Create `auth-server/src/services/openid.service.js`:

```javascript
function generateIdToken(user, clientId, scopes) {
  const claims = {
    iss: process.env.ISSUER_URL,
    sub: user.id,
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    auth_time: user.lastLoginTime
  };

  // Add claims based on scopes
  if (scopes.includes('profile')) {
    claims.name = user.name;
    claims.given_name = user.firstName;
    claims.family_name = user.lastName;
  }

  if (scopes.includes('email')) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified;
  }

  return jwt.sign(claims, process.env.JWT_SECRET);
}
```

### Step 3: Update Token Endpoint
Modify token controller to return ID token:

```javascript
// When scope includes 'openid'
if (scopes.includes('openid')) {
  response.id_token = generateIdToken(user, clientId, scopes);
}
```

### Step 4: Create UserInfo Endpoint
```javascript
// GET /userinfo
router.get('/userinfo', authenticateToken, (req, res) => {
  const user = req.user;  // From validated access token
  const scopes = req.scopes;

  const userInfo = { sub: user.id };

  if (scopes.includes('profile')) {
    userInfo.name = user.name;
    userInfo.given_name = user.firstName;
    // ... more profile fields
  }

  if (scopes.includes('email')) {
    userInfo.email = user.email;
    userInfo.email_verified = user.emailVerified;
  }

  res.json(userInfo);
});
```

### Step 5: Create Discovery Endpoint
```javascript
// GET /.well-known/openid-configuration
router.get('/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: process.env.ISSUER_URL,
    authorization_endpoint: `${process.env.ISSUER_URL}/authorize`,
    token_endpoint: `${process.env.ISSUER_URL}/token`,
    userinfo_endpoint: `${process.env.ISSUER_URL}/userinfo`,
    jwks_uri: `${process.env.ISSUER_URL}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    scopes_supported: ['openid', 'profile', 'email', 'read:users'],
    claims_supported: ['sub', 'name', 'email', 'given_name', 'family_name']
  });
});
```

### Step 6: Display ID Token in React
```javascript
// client-app/src/components/TokenDisplay.jsx
import jwt_decode from 'jwt-decode';

function TokenDisplay({ idToken }) {
  const decoded = jwt_decode(idToken);

  return (
    <div>
      <h3>User Information</h3>
      <p>Name: {decoded.name}</p>
      <p>Email: {decoded.email}</p>
      <p>User ID: {decoded.sub}</p>
    </div>
  );
}
```

## Testing Your OIDC Implementation

### Test 1: Request with OpenID Scope
```
/authorize?
  response_type=code
  &client_id=my-react-app
  &scope=openid profile email
  &redirect_uri=http://localhost:3000/callback
```

Should return an ID token along with access token.

### Test 2: Decode ID Token
Use jwt.io to decode the ID token. Verify:
- ✅ Contains user information
- ✅ Has correct audience (your client_id)
- ✅ Signed with your secret
- ✅ Expiration is in the future

### Test 3: Call UserInfo Endpoint
```http
GET /userinfo
Authorization: Bearer <access_token>
```

Should return user profile based on scopes.

### Test 4: Test Discovery
```http
GET /.well-known/openid-configuration
```

Should return valid discovery document.

## Common Mistakes to Avoid

❌ **Using access token to get user info in frontend**
✅ **Use ID token for user profile display**

❌ **Putting sensitive data in ID token**
✅ **ID tokens can be decoded by anyone - don't include secrets**

❌ **Not checking scopes before returning claims**
✅ **Only return claims that were requested**

❌ **Mixing up token audiences**
✅ **ID token aud = client_id, Access token aud = resource server**

## Phase 4 Checklist

Complete these tasks:

- [ ] Add `openid`, `profile`, and `email` scopes
- [ ] Implement ID token generation
- [ ] Return ID token from `/token` endpoint when `openid` scope requested
- [ ] Create `/userinfo` endpoint
- [ ] Create `/.well-known/openid-configuration` discovery endpoint
- [ ] Create `/.well-known/jwks.json` endpoint (if using RS256)
- [ ] Update React app to decode and display ID token
- [ ] Test with Postman

## What You've Learned

By completing this phase:

✅ You understand the difference between OAuth and OIDC
✅ You can generate and validate ID tokens
✅ You know what claims go in ID tokens
✅ You've built a UserInfo endpoint
✅ You understand how SSO works
✅ Your auth server is discoverable

## Next Steps

In Phase 5, you'll integrate WSO2 API Manager. WSO2 can read your discovery document and validate your tokens, making it easy to manage enterprise-scale APIs.

The foundation you've built (OAuth + OIDC) is now production-ready and follows industry standards!
