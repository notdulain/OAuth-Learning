# Understanding JSON Web Tokens (JWT)

JWT (pronounced "jot") is a way to securely send information between systems. Think of it as a tamper-proof envelope that anyone can open and read, but only you can seal.

## What Does a JWT Look Like?

A JWT is a long string with three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

↑ Part 1 (Header)  ↑ Part 2 (Payload)  ↑ Part 3 (Signature)
```

## The Three Parts of a JWT

### Part 1: Header
Describes how the token is protected

```json
{
  "alg": "HS256",      // Algorithm used (HMAC with SHA-256)
  "typ": "JWT"         // Type of token
}
```

Think of it as the envelope's label saying "sealed with wax" or "sealed with tape."

### Part 2: Payload
Contains the actual information (claims)

```json
{
  "sub": "user_123",              // Subject (who this is about)
  "name": "John Doe",             // User's name
  "email": "john@example.com",    // User's email
  "role": "admin",                // User's role
  "exp": 1730400000              // Expiration time
}
```

Think of this as the letter inside the envelope - the actual message.

### Part 3: Signature
Proves the token hasn't been tampered with

```
HMACSHA256(
  base64(header) + "." + base64(payload),
  your-secret-key
)
```

Think of this as a wax seal - only someone with the secret can create it, but anyone can verify it's intact.

## How JWT Works - A Real Example

### Creating a Token (Auth Server):

```javascript
// 1. Create the header
const header = {
  alg: "HS256",
  typ: "JWT"
};

// 2. Create the payload with user info
const payload = {
  sub: "user_123",
  name: "John Doe",
  email: "john@example.com",
  exp: Date.now() + 900000  // Expires in 15 minutes
};

// 3. Sign it with your secret key
const token = jwt.sign(payload, "your-secret-key-here");

// Result: eyJhbGc...
```

### Verifying a Token (Resource Server):

```javascript
// When API receives token in Authorization header
const token = req.headers.authorization.split(' ')[1];

try {
  // Verify signature and decode
  const decoded = jwt.verify(token, "your-secret-key-here");
  
  // Now you can trust the data
  console.log(decoded.name);   // "John Doe"
  console.log(decoded.email);  // "john@example.com"
  
  // Check if expired
  if (decoded.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  // Token is valid!
} catch (error) {
  // Token is invalid or expired
  res.status(401).json({ error: 'Invalid token' });
}
```

## Standard JWT Claims Explained

These are the standard fields you should include:

| Claim | Full Name | What It Means | Example |
|-------|-----------|---------------|---------|
| `iss` | Issuer | Who created this token | `"http://localhost:4000"` |
| `sub` | Subject | Who this token is about | `"user_123"` |
| `aud` | Audience | Who should accept this token | `"resource-server"` |
| `exp` | Expiration | When it expires | `1730400000` (Unix timestamp) |
| `iat` | Issued At | When it was created | `1730396400` |
| `nbf` | Not Before | Don't use before this time | `1730396400` |
| `jti` | JWT ID | Unique identifier for this token | `"abc-123-def"` |

### Why Each Claim Matters:

**iss (Issuer):**
```json
{ "iss": "http://localhost:4000" }
```
Tells the resource server where this token came from. Prevents tokens from fake auth servers.

**sub (Subject):**
```json
{ "sub": "user_123" }
```
The user ID. Should never change even if email/username changes.

**aud (Audience):**
```json
{ "aud": "resource-server" }
```
Which server should accept this token. Prevents using a token meant for one API on another.

**exp (Expiration):**
```json
{ "exp": 1730400000 }
```
Unix timestamp of when token expires. Security 101: tokens should expire!

**Custom Claims:**
```json
{
  "sub": "user_123",
  "role": "admin",           // Custom: user's role
  "scope": "read:users",     // Custom: permissions
  "tenant": "company-abc"    // Custom: multi-tenant ID
}
```

## The Two Types of Tokens in Your Project

### 1. Access Token (Short-Lived)
**Purpose**: Access APIs
**Contains**: User ID, permissions/scopes
**Lifetime**: 5-15 minutes
**Stored**: In memory or short-lived cookie

```json
{
  "iss": "http://localhost:4000",
  "sub": "user_123",
  "aud": "resource-server",
  "exp": 1730400000,
  "scope": "read:users read:products"
}
```

### 2. Refresh Token (Long-Lived)
**Purpose**: Get new access tokens
**Contains**: Minimal info (just user ID)
**Lifetime**: Hours to days
**Stored**: Secure database, tracked for revocation

```json
{
  "iss": "http://localhost:4000",
  "sub": "user_123",
  "type": "refresh",
  "exp": 1731004800,
  "jti": "unique-refresh-id"  // For revocation tracking
}
```

## Signing Algorithms - Which to Use?

### HS256 (Symmetric - Shared Secret)

**How it works:**
- One secret key for both signing and verifying
- Like a password that both sides know

**Pros:**
- ✅ Simple to implement
- ✅ Fast
- ✅ Good for single-server setups

**Cons:**
- ❌ Both sides need the secret
- ❌ If secret leaks, anyone can create tokens

**When to use:**
- Learning and development
- Auth server and resource server are the same app
- You trust all servers with the secret

```javascript
// Create token
const token = jwt.sign(payload, "my-secret-key", { algorithm: 'HS256' });

// Verify token
const decoded = jwt.verify(token, "my-secret-key");
```

### RS256 (Asymmetric - Public/Private Keys)

**How it works:**
- Private key (secret) for signing
- Public key (shared) for verifying
- Like a wax seal - only you can create it, anyone can verify it

**Pros:**
- ✅ More secure - private key never leaves auth server
- ✅ Anyone can verify tokens with public key
- ✅ Better for microservices
- ✅ Required for enterprise (WSO2, etc.)

**Cons:**
- ❌ More complex to set up
- ❌ Slightly slower than HS256

**When to use:**
- Production environments
- Multiple resource servers
- When integrating with WSO2
- When you want maximum security

```javascript
// Generate keys (one time)
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// Sign with private key
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

// Verify with public key
const decoded = jwt.verify(token, publicKey);
```

## Token Validation - Step by Step

When your resource server receives a token, validate it thoroughly:

### Step 1: Extract Token from Header
```javascript
const authHeader = req.headers.authorization;
// "Bearer eyJhbGc..."

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'No token provided' });
}

const token = authHeader.split(' ')[1];
```

### Step 2: Verify Structure
```javascript
const parts = token.split('.');
if (parts.length !== 3) {
  return res.status(401).json({ error: 'Invalid token format' });
}
```

### Step 3: Verify Signature
```javascript
try {
  const decoded = jwt.verify(token, SECRET_KEY);
} catch (error) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Step 4: Check Expiration
```javascript
const now = Math.floor(Date.now() / 1000);
if (decoded.exp < now) {
  return res.status(401).json({ error: 'Token expired' });
}
```

### Step 5: Validate Issuer and Audience
```javascript
if (decoded.iss !== 'http://localhost:4000') {
  return res.status(401).json({ error: 'Invalid issuer' });
}

if (decoded.aud !== 'resource-server') {
  return res.status(401).json({ error: 'Wrong audience' });
}
```

### Step 6: Check Scopes
```javascript
const requiredScope = 'read:users';
if (!decoded.scope.includes(requiredScope)) {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Complete Validation Middleware:
```javascript
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate claims
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      scopes: decoded.scope.split(' ')
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Token Storage Best Practices

### ✅ DO: Store in Memory (React State)
```javascript
// Best for SPAs
const [accessToken, setAccessToken] = useState(null);

// Gets cleared when page refreshes (that's good!)
```

### ✅ DO: Store in HttpOnly Cookies
```javascript
// Set from backend
res.cookie('token', accessToken, {
  httpOnly: true,    // JavaScript can't read it
  secure: true,      // Only sent over HTTPS
  sameSite: 'strict' // CSRF protection
});
```

### ❌ DON'T: Store in localStorage
```javascript
// ❌ BAD - vulnerable to XSS attacks
localStorage.setItem('token', accessToken);

// Any script on your page can steal this!
```

### ❌ DON'T: Log Full Tokens
```javascript
// ❌ BAD
console.log('Token:', token);

// ✅ GOOD - mask it
console.log('Token:', token.substring(0, 10) + '...');
```

## Debugging JWT Issues

### Tool 1: jwt.io
1. Go to https://jwt.io
2. Paste your token
3. See decoded header and payload
4. Verify signature (paste your secret)

### Tool 2: Your React Component
```javascript
import jwt_decode from 'jwt-decode';

function TokenDebugger({ token }) {
  const decoded = jwt_decode(token);
  
  return (
    <div>
      <h3>Token Contents:</h3>
      <pre>{JSON.stringify(decoded, null, 2)}</pre>
      
      <p>Expires: {new Date(decoded.exp * 1000).toLocaleString()}</p>
      <p>Issued: {new Date(decoded.iat * 1000).toLocaleString()}</p>
    </div>
  );
}
```

### Common Errors and Solutions:

**"Token is not yet valid"**
- Problem: Server clocks are out of sync
- Solution: Check `iat` claim, sync server times

**"Invalid signature"**
- Problem: Using wrong secret key
- Solution: Make sure both servers use same secret

**"Token expired"**
- Problem: Token lifetime is too short, or user is slow
- Solution: Use refresh token to get new access token

**"Wrong audience"**
- Problem: Token meant for different API
- Solution: Check `aud` claim matches your server

## Implementation Checklist

### In Auth Server:

- [ ] Install `jsonwebtoken` package
- [ ] Create `jwt.service.js` with sign/verify functions
- [ ] Generate strong secret key (store in .env)
- [ ] Set appropriate token lifetimes (access: 15 min, refresh: 7 days)
- [ ] Include all standard claims (iss, sub, aud, exp, iat)
- [ ] Add custom claims (scope, role) as needed

### In Resource Server:

- [ ] Create `jwt-auth.js` middleware
- [ ] Verify signature with same secret
- [ ] Validate all claims (exp, iss, aud)
- [ ] Extract user info and attach to request
- [ ] Create `scope-check.js` middleware for permissions
- [ ] Handle errors with proper status codes

### In Client App:

- [ ] Store tokens securely (memory or httpOnly cookies)
- [ ] Include token in Authorization header
- [ ] Handle 401 errors (expired token)
- [ ] Use refresh token to renew access
- [ ] Display token contents in debug component

## Key Takeaways

1. **JWT is not encryption** - anyone can decode it, but only the holder of the secret can create/modify it
2. **Keep tokens short-lived** - 15 minutes for access tokens is common
3. **Use refresh tokens** - to renew without re-login
4. **Validate everything** - signature, expiration, issuer, audience, scopes
5. **Never log full tokens** - they're like passwords
6. **Start with HS256** - move to RS256 for production

## What You've Built

By completing this phase, you can:

✅ Generate JWT access and refresh tokens
✅ Sign tokens with HS256 or RS256
✅ Validate token signatures
✅ Check token expiration and claims
✅ Protect API endpoints with JWT middleware
✅ Debug token issues

Your tokens are now production-quality and follow OAuth 2.0 best practices!
