# OAuth 2.0 Flows - Understanding Authorization

OAuth 2.0 is like a valet key for your car - it gives limited access without handing over the master key. This guide explains how OAuth works using real-world analogies and step-by-step examples.

## The Big Picture - Who's Who in OAuth

Imagine you're using a photo printing app that needs access to your Google Photos:

- **You (Resource Owner)**: The person who owns the photos
- **Photo Printing App (Client)**: The app that wants to access your photos
- **Google Photos (Resource Server)**: Where your photos are stored
- **Google's Login System (Authorization Server)**: Decides if the app can access your photos

OAuth lets the printing app access your photos **without ever seeing your Google password**.

## The Key Players in Our Project

| Player | Real Example | In Our Project | What They Do |
|--------|--------------|----------------|--------------|
| **Resource Owner** | You | The end user | Owns the data |
| **Client** | Photo printing app | React app | Wants to access data |
| **Authorization Server** | Google login | `auth-server` | Issues access tokens |
| **Resource Server** | Google Photos | `resource-server` | Hosts the protected APIs |

## What Are Scopes?

Scopes are like permission slips. They specify exactly what the client can do:

```
read:users     → Can view user information
write:users    → Can create/update users
read:products  → Can view products
admin:all      → Can do everything
```

When an app asks for access, it requests specific scopes. You then approve or deny them.

## The Three Main OAuth Flows

### Flow 1: Authorization Code Flow (Most Common)

**Use Case**: Web apps, mobile apps where users log in

**Real-World Analogy**: Like getting a claim ticket at a coat check
1. You give your coat to the attendant
2. They give you a claim ticket (authorization code)
3. Later, you exchange the ticket for your coat (access token)

**How It Works:**

```
1. User clicks "Login" in React app
   ↓
2. React app redirects to auth server:
   http://localhost:4000/authorize?
     response_type=code
     &client_id=my-react-app
     &redirect_uri=http://localhost:3000/callback
     &scope=read:users
   ↓
3. User logs in and approves the scopes
   ↓
4. Auth server redirects back with a code:
   http://localhost:3000/callback?code=ABC123
   ↓
5. React app exchanges code for tokens:
   POST http://localhost:4000/token
   {
     grant_type: "authorization_code",
     code: "ABC123",
     client_id: "my-react-app",
     client_secret: "secret123"
   }
   ↓
6. Auth server returns tokens:
   {
     access_token: "eyJhbG...",
     refresh_token: "def456...",
     expires_in: 900  // 15 minutes
   }
```

**Why use a code instead of directly giving the token?**
- The code is temporary (expires in seconds)
- Even if someone steals the code, they need the client_secret to use it
- More secure for browser-based apps

### Flow 2: Client Credentials Flow

**Use Case**: Machine-to-machine communication (no user involved)

**Real-World Analogy**: Like a building access card for employees - automated, no questions asked

**How It Works:**

```
1. Backend service needs to call an API
   ↓
2. Service sends its credentials directly:
   POST http://localhost:4000/token
   {
     grant_type: "client_credentials",
     client_id: "backend-service",
     client_secret: "service-secret-key",
     scope: "internal:metrics"
   }
   ↓
3. Auth server returns access token:
   {
     access_token: "eyJhbG...",
     expires_in: 3600
   }
   ↓
4. Service uses token to call APIs
```

**When to use:**
- Cron jobs that need to access APIs
- Backend services talking to each other
- No user is involved, just service accounts

### Flow 3: Refresh Token Flow

**Use Case**: Getting a new access token when the old one expires

**Real-World Analogy**: Like renewing your driver's license without retaking the test

**How It Works:**

```
1. Access token expires (after 15 minutes)
   ↓
2. Instead of making user log in again, use refresh token:
   POST http://localhost:4000/token
   {
     grant_type: "refresh_token",
     refresh_token: "def456..."
   }
   ↓
3. Auth server returns new tokens:
   {
     access_token: "new-token-xyz...",
     refresh_token: "new-refresh-789...",  // optional: token rotation
     expires_in: 900
   }
```

**Important Security Practices:**

1. **Token Rotation**: Give a new refresh token each time (invalidate the old one)
2. **Detect Reuse**: If someone tries to use an old refresh token, revoke everything
3. **Long But Limited**: Refresh tokens last longer (days) but can be revoked anytime

## The Endpoints You Need to Build

Your auth server needs these endpoints:

### 1. Authorization Endpoint
```
GET /authorize
```
- Shows login page
- User approves scopes
- Returns authorization code

### 2. Token Endpoint
```
POST /token
```
- Exchanges authorization code for tokens
- Handles refresh token requests
- Handles client credentials requests

### 3. Token Revocation (Optional)
```
POST /revoke
```
- Invalidates refresh tokens
- Used when user logs out

## Token Lifetimes - How Long They Last

| Token Type | Typical Lifetime | Why? |
|------------|------------------|------|
| **Authorization Code** | 30-60 seconds | Very temporary, just for the exchange |
| **Access Token** | 5-15 minutes | Short-lived for security |
| **Refresh Token** | Hours to days | Longer-lived but can be revoked |

**Why are access tokens short-lived?**
- If stolen, they expire quickly
- Limits the damage from a security breach
- Forces regular token refreshes (which can be monitored)

## Designing Your Tokens

When you create a JWT token, include these claims:

```json
{
  "iss": "http://localhost:4000",          // Who issued this token
  "sub": "user_123",                        // Who this token is for
  "aud": "resource-server",                 // Who should accept this token
  "exp": 1730400000,                        // When it expires (Unix timestamp)
  "iat": 1730396400,                        // When it was issued
  "scope": "read:users read:products"       // What it can do
}
```

**Think of it like an ID badge:**
- `iss` = which company issued it
- `sub` = whose badge it is
- `aud` = which buildings accept it
- `exp` = expiration date
- `scope` = which rooms you can enter

## Security Essentials - Don't Skip These!

### 1. Always Validate Redirect URIs
```javascript
// ❌ DANGEROUS - allows any redirect
if (redirectUri) {
  res.redirect(redirectUri);
}

// ✅ SAFE - only allow whitelisted URLs
const allowedRedirects = [
  'http://localhost:3000/callback',
  'https://myapp.com/callback'
];
if (allowedRedirects.includes(redirectUri)) {
  res.redirect(redirectUri);
}
```

### 2. Bind Authorization Codes
Authorization codes should only work with the client that requested them:
```javascript
// Store with code
{
  code: 'ABC123',
  clientId: 'my-react-app',
  redirectUri: 'http://localhost:3000/callback',
  expiresAt: Date.now() + 60000  // 60 seconds
}
```

### 3. Use HTTPS
Even in development, try to use HTTPS. OAuth tokens are like keys - protect them!

### 4. Log Everything
Log all token exchanges so you can debug issues:
```javascript
console.log(`Token issued: client=${clientId}, scopes=${scopes}, user=${userId}`);
```

## Implementation Checklist

### Step 1: Configure OAuth Settings
Create `auth-server/src/config/oauth-config.js`:

```javascript
module.exports = {
  clients: [
    {
      clientId: 'my-react-app',
      clientSecret: 'secret123',
      redirectUris: ['http://localhost:3000/callback'],
      allowedScopes: ['read:users', 'read:products']
    }
  ],
  scopes: {
    'read:users': 'Read user information',
    'write:users': 'Create and update users',
    'read:products': 'Read product catalog'
  },
  tokenLifetimes: {
    authorizationCode: 60,      // seconds
    accessToken: 900,           // 15 minutes
    refreshToken: 604800        // 7 days
  }
};
```

### Step 2: Build the Authorization Flow
In `auth-server/src/controllers/auth.controller.js`:

```javascript
// Handle GET /authorize
async function authorize(req, res) {
  // 1. Validate client_id and redirect_uri
  // 2. Show login page if not authenticated
  // 3. Show consent page for scopes
  // 4. Generate authorization code
  // 5. Redirect back with code
}
```

### Step 3: Build the Token Exchange
In `auth-server/src/controllers/token.controller.js`:

```javascript
// Handle POST /token
async function token(req, res) {
  const { grant_type } = req.body;
  
  if (grant_type === 'authorization_code') {
    // Exchange code for tokens
  } else if (grant_type === 'refresh_token') {
    // Issue new access token
  } else if (grant_type === 'client_credentials') {
    // Issue service account token
  }
}
```

### Step 4: Validate Clients
In `auth-server/src/middleware/validate-client.js`:

```javascript
async function validateClient(req, res, next) {
  const { client_id, client_secret } = req.body;
  
  // Look up client in database/config
  // Verify secret matches
  // Attach client info to request
  
  next();
}
```

## Testing with Postman

Create these requests in Postman:

1. **Get Authorization Code** (manual - copy from browser)
2. **Exchange Code for Token** (POST /token)
3. **Use Access Token** (GET /api/users with Authorization header)
4. **Refresh Token** (POST /token with refresh_token)

## Common Pitfalls to Avoid

❌ **Storing tokens in localStorage** - can be stolen by XSS attacks
✅ **Use httpOnly cookies or memory storage**

❌ **Long-lived access tokens** - increases security risk
✅ **Short access tokens + refresh tokens**

❌ **Not validating redirect URIs** - enables redirect attacks
✅ **Whitelist all redirect URIs**

❌ **Reusing authorization codes** - should be one-time use
✅ **Invalidate codes after first use**

## What You'll Build

By the end of this phase, you'll have:

- [ ] Authorization endpoint that handles user login
- [ ] Token endpoint that exchanges codes for tokens
- [ ] Client credentials flow for service accounts
- [ ] Refresh token flow for renewing access
- [ ] Proper token validation and error handling
- [ ] Postman collection to test all flows

## Next Steps

Once OAuth is working, you'll add OpenID Connect in Phase 4. OIDC adds user identity information on top of OAuth's authorization framework.

Remember: OAuth is about **authorization** (what can you do), while OpenID Connect adds **authentication** (who are you). Get OAuth solid first!
