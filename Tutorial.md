# OAuth 2.0 + OpenID Connect + JWT Learning Project with WSO2

## Project Overview
A microservices-based project that demonstrates OAuth 2.0, OpenID Connect, JWT tokens, and API management using WSO2 API Manager.

## Project Structure

```
oauth-learning-project/
├── README.md                                    # Main project documentation
├── docker-compose.yml                           # Orchestrates all services (auth, resource, client, WSO2)
├── .env.example                                 # Environment variables template
│
├── wso2-setup/                                  # WSO2 API Manager configuration
│   ├── README.md                                # WSO2 setup instructions
│   ├── docker-compose-wso2.yml                  # WSO2 container configuration
│   ├── deployment.toml                          # WSO2 server settings (ports, database, OAuth)
│   └── apis/                                    # API definitions for WSO2 gateway
│       ├── user-api-swagger.yaml                # User API OpenAPI spec for WSO2
│       └── product-api-swagger.yaml             # Product API OpenAPI spec for WSO2
│
├── auth-server/                                 # OAuth 2.0 & OpenID Connect authorization server
│   ├── package.json                             # Node dependencies (express, jsonwebtoken)
│   ├── .env                                     # Auth server secrets (JWT keys, client credentials)
│   ├── src/
│   │   ├── index.js                             # Express app entry point, starts server
│   │   ├── config/
│   │   │   └── oauth-config.js                  # OAuth settings (redirect URIs, scopes, grant types)
│   │   ├── routes/
│   │   │   ├── auth.routes.js                   # Routes: /authorize, /login, /consent
│   │   │   └── token.routes.js                  # Routes: /token, /revoke, /introspect
│   │   ├── controllers/
│   │   │   ├── auth.controller.js               # Handles authorization flow (code generation)
│   │   │   └── token.controller.js              # Issues access/refresh tokens, validates grants
│   │   ├── middleware/
│   │   │   ├── validate-client.js               # Verifies client_id and client_secret
│   │   │   └── jwt-verify.js                    # Validates JWT signatures and expiration
│   │   ├── services/
│   │   │   ├── jwt.service.js                   # Creates and verifies JWT tokens
│   │   │   ├── oauth.service.js                 # Manages authorization codes and token exchange
│   │   │   └── openid.service.js                # Generates ID tokens with user claims
│   │   └── utils/
│   │       ├── token-generator.js               # Generates random codes and tokens
│   │       └── crypto.js                        # Encryption/hashing utilities
│   └── README.md                                # Auth server documentation
│
├── resource-server/                             # Protected API server (your backend APIs)
│   ├── package.json                             # Node dependencies
│   ├── .env                                     # API server config (JWT public key, WSO2 URL)
│   ├── src/
│   │   ├── index.js                             # Express app entry point
│   │   ├── routes/
│   │   │   ├── users.routes.js                  # User endpoints: GET /api/users, GET /api/users/:id
│   │   │   └── products.routes.js               # Product endpoints: GET /api/products
│   │   ├── controllers/
│   │   │   ├── users.controller.js              # User business logic
│   │   │   └── products.controller.js           # Product business logic
│   │   ├── middleware/
│   │   │   ├── jwt-auth.js                      # Validates JWT from Authorization header
│   │   │   └── scope-check.js                   # Checks if token has required scopes
│   │   └── services/
│   │       └── wso2-integration.service.js      # Validates tokens against WSO2, checks rate limits
│   └── README.md                                # Resource server documentation
│
├── client-app/                                  # React frontend application
│   ├── package.json                             # React dependencies
│   ├── .env                                     # Frontend config (auth server URL, client_id)
│   ├── public/
│   │   └── index.html                           # HTML template
│   ├── src/
│   │   ├── index.js                             # React app entry point
│   │   ├── App.jsx                              # Main app component with routing
│   │   ├── components/
│   │   │   ├── Login.jsx                        # Login button, initiates OAuth flow
│   │   │   ├── Dashboard.jsx                    # Protected page showing user data
│   │   │   ├── TokenDisplay.jsx                 # Shows decoded JWT tokens
│   │   │   └── ApiTester.jsx                    # UI to test API calls with tokens
│   │   ├── services/
│   │   │   ├── auth.service.js                  # OAuth flow logic (redirect, token exchange)
│   │   │   └── api.service.js                   # Makes authenticated API calls
│   │   └── utils/
│   │       └── jwt-decoder.js                   # Decodes JWT to display claims
│   └── README.md                                # Client app documentation
│
├── docs/                                        # Learning materials
│   ├── 01-api-basics.md                         # REST API concepts, HTTP methods
│   ├── 02-oauth2-flow.md                        # OAuth 2.0 grant types explained
│   ├── 03-openid-connect.md                     # OIDC concepts, ID tokens
│   ├── 04-jwt-structure.md                      # JWT anatomy (header, payload, signature)
│   ├── 05-wso2-setup.md                         # WSO2 installation and configuration guide
│   └── diagrams/
│       ├── oauth-flow.png                       # Visual diagram of OAuth flow
│       └── architecture.png                     # System architecture diagram
│
└── postman/                                     # API testing collections
    ├── OAuth-Learning.postman_collection.json   # Pre-configured API requests
    └── OAuth-Learning.postman_environment.json  # Environment variables for Postman
```

## Learning Path

### Phase 1: Understand the Basics (Week 1)
**Goal:** Understand REST APIs and authentication basics

1. **Read Documentation**
   - `docs/01-api-basics.md` - REST API principles
   - Build a simple API without authentication in `resource-server/`

2. **Hands-on Task**
   - Create 2 endpoints: GET /users and GET /products
   - Test with Postman
   - Understand request/response cycle

### Phase 2: JWT Implementation (Week 2)
**Goal:** Learn how JWT tokens work

1. **Read Documentation**
   - `docs/04-jwt-structure.md` - JWT anatomy

2. **Hands-on Task**
   - Implement JWT creation in `auth-server/src/services/jwt.service.js`
   - Create tokens with custom claims
   - Verify tokens in `resource-server/src/middleware/jwt-auth.js`
   - Decode and inspect tokens in the client app

**Key Files to Implement:**
```javascript
// auth-server/src/services/jwt.service.js
- generateAccessToken()
- generateRefreshToken()
- verifyToken()

// resource-server/src/middleware/jwt-auth.js
- validateJWT()
- extractUserInfo()
```

### Phase 3: OAuth 2.0 Flows (Week 3)
**Goal:** Implement OAuth 2.0 authorization flows

1. **Read Documentation**
   - `docs/02-oauth2-flow.md` - OAuth 2.0 grant types

2. **Hands-on Tasks**
   - Implement Authorization Code flow
   - Implement Client Credentials flow
   - Implement Refresh Token flow

**Key Files to Implement:**
```javascript
// auth-server/src/controllers/auth.controller.js
- authorizationEndpoint() - GET /authorize
- tokenEndpoint() - POST /token
- refreshEndpoint() - POST /token (grant_type=refresh_token)

// client-app/src/services/auth.service.js
- initiateAuthFlow()
- handleCallback()
- refreshAccessToken()
```

### Phase 4: OpenID Connect (Week 4)
**Goal:** Add identity layer with OpenID Connect

1. **Read Documentation**
   - `docs/03-openid-connect.md` - OIDC concepts

2. **Hands-on Tasks**
   - Add ID Token generation
   - Implement UserInfo endpoint
   - Add OIDC discovery endpoint

**Key Files to Implement:**
```javascript
// auth-server/src/services/openid.service.js
- generateIdToken()
- getUserInfo()
- getDiscoveryDocument()

// Endpoints to add:
- GET /.well-known/openid-configuration
- GET /userinfo
- GET /jwks.json
```

### Phase 5: WSO2 API Manager Integration (Week 5-6)
**Goal:** Learn enterprise API management

1. **Read Documentation**
   - `docs/05-wso2-setup.md` - WSO2 installation and configuration

2. **Setup Tasks**
   - Install WSO2 API Manager using Docker
   - Configure OAuth 2.0 application
   - Create API definitions
   - Set up rate limiting and throttling

3. **Integration Tasks**
   - Publish your APIs to WSO2
   - Configure OAuth 2.0 with WSO2 as Authorization Server
   - Implement token validation via WSO2
   - Set up API policies (rate limiting, CORS)

**Key Configurations:**
```yaml
# wso2-setup/apis/user-api-swagger.yaml
- Define API endpoints
- Configure security schemes
- Set rate limits

# resource-server/src/services/wso2-integration.service.js
- validateTokenWithWSO2()
- checkRateLimit()
- logApiUsage()
```

## Technology Stack

### Auth Server
- **Runtime:** Node.js with Express
- **JWT:** jsonwebtoken, jose
- **Security:** bcrypt, crypto
- **Validation:** joi

### Resource Server
- **Runtime:** Node.js with Express
- **JWT Validation:** jsonwebtoken
- **WSO2 Integration:** axios for API calls
- **Database:** PostgreSQL (optional, for user data)

### Client App
- **Framework:** React
- **HTTP Client:** axios
- **Routing:** react-router-dom
- **State:** React Context API

### WSO2 API Manager
- **Version:** WSO2 API Manager 4.2.0
- **Deployment:** Docker
- **Database:** H2 (default) or MySQL/PostgreSQL

## Key Learning Objectives

### APIs
- [ ] RESTful API design principles
- [ ] HTTP methods and status codes
- [ ] Request/response structure
- [ ] API versioning
- [ ] Error handling

### OAuth 2.0
- [ ] Authorization Code flow
- [ ] Client Credentials flow
- [ ] Refresh Token flow
- [ ] PKCE (Proof Key for Code Exchange)
- [ ] Scopes and permissions
- [ ] Client authentication

### OpenID Connect
- [ ] ID Token vs Access Token
- [ ] UserInfo endpoint
- [ ] OIDC Discovery
- [ ] Claims and scopes
- [ ] Session management

### JWT
- [ ] Token structure (header, payload, signature)
- [ ] Signing algorithms (HS256, RS256)
- [ ] Token validation
- [ ] Expiration and refresh
- [ ] Custom claims

### WSO2 API Manager
- [ ] API lifecycle management
- [ ] OAuth 2.0 configuration
- [ ] Rate limiting and throttling
- [ ] API analytics
- [ ] Developer portal
- [ ] API policies and mediation

## Running the Project

### Step 1: Start WSO2 API Manager
```bash
cd wso2-setup
docker-compose -f docker-compose-wso2.yml up -d
# Access at https://localhost:9443
```

### Step 2: Start Auth Server
```bash
cd auth-server
npm install
npm run dev
# Runs on http://localhost:4000
```

### Step 3: Start Resource Server
```bash
cd resource-server
npm install
npm run dev
# Runs on http://localhost:5000
```

### Step 4: Start Client App
```bash
cd client-app
npm install
npm start
# Runs on http://localhost:3000
```

## Testing Workflows

### Workflow 1: Authorization Code Flow
1. Navigate to client app
2. Click "Login"
3. Redirected to auth server
4. Enter credentials
5. Authorize scopes
6. Redirected back with authorization code
7. Client exchanges code for tokens
8. Inspect JWT access token and ID token

### Workflow 2: API Call with Access Token
1. Use access token from Workflow 1
2. Call GET /api/users with Bearer token
3. Observe token validation in resource server
4. Check WSO2 analytics dashboard

### Workflow 3: Token Refresh
1. Wait for access token to expire
2. Use refresh token to get new access token
3. Continue making API calls

### Workflow 4: WSO2 Integration
1. Create API in WSO2 Developer Portal
2. Subscribe to API with application
3. Generate OAuth tokens via WSO2
4. Call published API through WSO2 gateway
5. View analytics and rate limiting in action

## Additional Resources

### Recommended Reading Order
1. `docs/01-api-basics.md`
2. `docs/04-jwt-structure.md`
3. `docs/02-oauth2-flow.md`
4. `docs/03-openid-connect.md`
5. `docs/05-wso2-setup.md`

### External Resources
- OAuth 2.0 RFC: https://tools.ietf.org/html/rfc6749
- OpenID Connect: https://openid.net/connect/
- JWT.io: https://jwt.io
- WSO2 Docs: https://apim.docs.wso2.com/

## Troubleshooting Guide

### Common Issues
1. **CORS errors:** Configure CORS in auth and resource servers
2. **Token validation fails:** Check JWT secret/keys consistency
3. **WSO2 connection:** Verify Docker container is running
4. **Redirect URIs:** Must match exactly in OAuth config

## Next Steps After Completion

- Implement PKCE for mobile apps
- Add multi-factor authentication
- Explore API Gateway patterns
- Learn about API security best practices
- Study microservices authentication patterns
- Implement Single Sign-On (SSO)