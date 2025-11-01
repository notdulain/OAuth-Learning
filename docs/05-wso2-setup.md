# WSO2 API Manager Setup - Enterprise API Management

WSO2 API Manager is like having a professional bouncer and manager for your APIs. It handles security, monitors traffic, enforces rules, and provides dashboards - all the enterprise features you'd need in production.

## What WSO2 Gives You

Think of WSO2 as a complete API management solution:

- **API Gateway**: All requests go through WSO2 first (like airport security)
- **Security**: Built-in OAuth 2.0, API keys, rate limiting
- **Developer Portal**: Where developers discover and subscribe to your APIs
- **Publisher Portal**: Where you manage and publish APIs
- **Analytics**: Dashboards showing who's using what, when, and how
- **Monetization**: Charge for API usage (subscription plans)

## Before You Start

Make sure you have:
- ✅ Docker and Docker Compose installed
- ✅ At least 8 GB free RAM (WSO2 is memory-hungry)
- ✅ Ports available: 9443, 9763, 8243, 8280
- ✅ Your auth and resource servers working from previous phases

## Starting WSO2

### Step 1: Navigate to WSO2 Setup Folder
```bash
cd wso2-setup
```

### Step 2: Start WSO2 Container
```bash
docker-compose -f docker-compose-wso2.yml up -d
```

This downloads and starts WSO2. First time takes 5-10 minutes.

### Step 3: Wait for Startup
```bash
docker-compose logs -f
```

Look for: `"Server started in X seconds"`

### Step 4: Access the Portals

Once started, open these URLs:

| Portal | URL | Purpose |
|--------|-----|---------|
| **Publisher** | https://localhost:9443/publisher | Manage and publish APIs |
| **Developer Portal** | https://localhost:9443/devportal | Discover and subscribe to APIs |
| **Admin Console** | https://localhost:9443/carbon | System administration |

**Default Login**: 
- Username: `admin`
- Password: `admin`

**⚠️ Important**: Your browser will show a security warning because WSO2 uses a self-signed certificate. Click "Advanced" → "Proceed anyway" (this is safe for local development).

## Understanding the WSO2 Workflow

Here's how WSO2 fits into your project:

```
User's Browser
    ↓
React App (localhost:3000)
    ↓
WSO2 API Gateway (localhost:8243) ← You publish APIs here
    ↓ ← Checks token, rate limits, logs request
    ↓
Your Resource Server (localhost:5000)
    ↓
Returns data
    ↓
WSO2 Gateway logs response
    ↓
Back to React App
```

## Your First API - Step by Step

### Step 1: Login to Publisher
1. Go to https://localhost:9443/publisher
2. Login with `admin` / `admin`

### Step 2: Create a New API

**Option A: Import OpenAPI Spec (Recommended)**
1. Click **"Create API"** → **"Import OpenAPI"**
2. Click **"Browse"** → Select `wso2-setup/apis/user-api-swagger.yaml`
3. Click **"Next"**

**Option B: Create from Scratch**
1. Click **"Create API"** → **"Design a new REST API"**
2. Fill in basic info:
   - Name: `User API`
   - Context: `/users`
   - Version: `v1`

### Step 3: Configure Endpoints
This tells WSO2 where your actual API lives:

1. Click **"Endpoints"** in the left menu
2. Add Production Endpoint:
   ```
   http://resource-server:5000/api/users
   ```
   **Note**: Use Docker service name `resource-server`, not `localhost`

### Step 4: Add Resources (API Paths)
If you didn't import OpenAPI, add your endpoints manually:

1. Click **"Resources"**
2. Add:
   - `GET /users` - Get all users
   - `GET /users/{id}` - Get one user
   - `POST /users` - Create user
   - `PUT /users/{id}` - Update user
   - `DELETE /users/{id}` - Delete user

### Step 5: Configure Security
1. Click **"Runtime"** → **"Application Security"**
2. Check: **OAuth 2.0**
3. Add scopes:
   - `read:users` - Can read user data
   - `write:users` - Can modify user data

### Step 6: Set Rate Limiting
1. Click **"Runtime"** → **"Rate Limiting"**
2. Choose a policy:
   - **Bronze**: 1000 requests/day
   - **Silver**: 5000 requests/day
   - **Gold**: 10000 requests/day
   - **Unlimited**: No limits

### Step 7: Save and Publish
1. Click **"Save"**
2. Click **"Lifecycle"** → **"Publish"**

Your API is now live! 🎉

## Using Your Published API

### As a Developer (Consumer)

1. **Go to Developer Portal**: https://localhost:9443/devportal
2. **Find your API**: You'll see "User API v1"
3. **Subscribe**:
   - Click on the API
   - Click **"Subscribe"**
   - Choose or create an application (e.g., "My React App")
   - Select subscription tier (Bronze/Silver/Gold)
   - Click **"Subscribe"**

4. **Generate Keys**:
   - Go to **"Applications"** → Select your app
   - Click **"Production Keys"** → **"Generate Keys"**
   - Copy the **Consumer Key** and **Consumer Secret**

5. **Get Access Token**:
   - In the same page, click **"Generate Access Token"**
   - Or use the token endpoint (recommended)

### Getting a Token via API

```bash
curl -X POST https://localhost:9443/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CONSUMER_KEY" \
  -d "client_secret=YOUR_CONSUMER_SECRET" \
  -k
```

Response:
```json
{
  "access_token": "eyJhbGciOiJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Calling Your API Through WSO2

```bash
curl -X GET https://localhost:8243/users/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -k
```

**Note**: 
- Port `8243` is the WSO2 Gateway (HTTPS)
- Port `8280` is for HTTP (not recommended)

## Two Ways to Use WSO2 with Your Auth Server

### Option 1: Use WSO2 as the Authorization Server (Simpler)

Let WSO2 handle everything:
- User login → WSO2
- Token generation → WSO2
- Token validation → WSO2

**Steps:**
1. Register your React app in WSO2 Developer Portal
2. Get consumer key/secret
3. Update React app to use WSO2 endpoints:
   ```javascript
   AUTHORIZATION_URL=https://localhost:9443/oauth2/authorize
   TOKEN_URL=https://localhost:9443/oauth2/token
   ```

### Option 2: Use Your Auth Server (More Control)

Keep your custom auth server, let WSO2 validate tokens:

**Steps:**
1. Configure WSO2 to trust your JWT tokens
2. WSO2 validates tokens using your JWKS endpoint
3. Your auth server issues tokens, WSO2 enforces policies

**Configuration in `deployment.toml`:**
```toml
[[event_listener]]
id = "token_revocation"
type = "org.wso2.carbon.identity.core.handler.AbstractIdentityHandler"
name = "org.wso2.is.notification.ApimOauthEventInterceptor"
order = 1

[oauth.token_validation]
validation_endpoint = "http://auth-server:4000/.well-known/jwks.json"
```

**Recommendation**: Start with Option 1 to learn WSO2, then try Option 2 for custom auth.

## Understanding WSO2 Analytics

WSO2 tracks everything automatically:

### Access the Analytics Dashboard
1. Go to Publisher Portal
2. Click on your API
3. Click **"Analytics"**

### What You Can See:
- **Request Count**: How many times API was called
- **Latency**: How fast responses are
- **Error Rate**: Failed requests (4xx, 5xx)
- **Top Users**: Who's using your API most
- **Throttled Requests**: When rate limits were hit

### Real-World Use:
```
"We noticed 1000 failed requests yesterday.
Looking at analytics, they all came from one app.
The app was sending invalid tokens.
We contacted the developer and fixed it."
```

## Rate Limiting in Action

### How It Works:

1. Developer subscribes to Bronze tier (1000 req/day)
2. Makes 500 requests → All successful
3. Makes 501st request → Still works
4. Makes 1001st request → **429 Too Many Requests**

### Response When Rate Limited:
```json
{
  "fault": {
    "code": 900804,
    "message": "Message throttled out",
    "description": "You have exceeded your quota"
  }
}
```

### Setting Custom Rate Limits:

1. Go to Admin Portal: https://localhost:9443/admin
2. Click **"Rate Limiting Policies"** → **"Advanced Policies"**
3. Create custom policy:
   - Name: `Premium Plan`
   - Limit: `100 requests per minute`
   - Quota: `50000 requests per day`

## Troubleshooting Common Issues

### Issue 1: Can't Access Portals
**Error**: "This site can't be reached"

**Solutions**:
- Check if container is running: `docker ps`
- Check logs: `docker-compose logs wso2apim`
- Wait 5-10 minutes for full startup
- Restart: `docker-compose restart`

### Issue 2: Certificate Warnings
**Error**: "Your connection is not private"

**Solution**:
- Click "Advanced" → "Proceed to localhost"
- Or import WSO2 certificate to your system
- This is normal for local development

### Issue 3: API Returns 404
**Error**: "API not found"

**Checklist**:
- ✅ API is published (not just saved)
- ✅ Using correct URL: `https://localhost:8243/CONTEXT/VERSION/RESOURCE`
- ✅ Example: `https://localhost:8243/users/v1/users`

### Issue 4: 401 Unauthorized
**Error**: "Invalid credentials"

**Checklist**:
- ✅ Token is included in Authorization header
- ✅ Token format is correct: `Bearer YOUR_TOKEN`
- ✅ Token hasn't expired
- ✅ Application is subscribed to the API

### Issue 5: Can't Reach Resource Server
**Error**: "Connection refused to resource-server:5000"

**Solutions**:
- Make sure both containers are on same Docker network
- Use service name, not `localhost`:
  - ❌ `http://localhost:5000/api`
  - ✅ `http://resource-server:5000/api`
- Update `docker-compose.yml` to include both services

### Issue 6: High CPU/Memory Usage
**Problem**: Computer becomes slow

**Solutions**:
- Increase Docker memory limit (8 GB minimum)
- Edit `docker-compose-wso2.yml`:
  ```yaml
  environment:
    JVM_MEM_OPTS: "-Xms2g -Xmx4g"  # Adjust based on your RAM
  ```
- Stop WSO2 when not using: `docker-compose down`

## Integrating with Your Project

### Update docker-compose.yml
Make sure all services are on the same network:

```yaml
version: '3'
services:
  auth-server:
    build: ./auth-server
    ports:
      - "4000:4000"
    networks:
      - oauth-network

  resource-server:
    build: ./resource-server
    ports:
      - "5000:5000"
    networks:
      - oauth-network

  wso2apim:
    image: wso2/wso2am:4.2.0
    ports:
      - "9443:9443"
      - "8243:8243"
    networks:
      - oauth-network

networks:
  oauth-network:
    driver: bridge
```

### Update Resource Server
Add WSO2 integration service:

```javascript
// resource-server/src/services/wso2-integration.service.js

async function validateWithWSO2(token) {
  try {
    const response = await axios.post(
      'https://localhost:9443/oauth2/introspect',
      { token },
      {
        auth: {
          username: process.env.WSO2_CLIENT_ID,
          password: process.env.WSO2_CLIENT_SECRET
        }
      }
    );
    
    return response.data.active;
  } catch (error) {
    console.error('WSO2 validation failed:', error);
    return false;
  }
}
```

## Best Practices

### 1. Use Separate Environments
- **Development**: Your local WSO2
- **Staging**: Separate WSO2 instance with test data
- **Production**: Dedicated WSO2 with monitoring

### 2. Version Your APIs
```
v1/users  → Current production version
v2/users  → New version being developed
```

### 3. Document Everything
Use the API description fields:
- What the API does
- Required scopes
- Example requests/responses
- Error codes

### 4. Monitor Regularly
Check analytics weekly:
- Which APIs are most used?
- Are there errors?
- Are rate limits appropriate?

### 5. Rotate Secrets
Change client secrets periodically:
1. Generate new secret in Developer Portal
2. Update all applications
3. Revoke old secret

## Phase 5 Checklist

Complete these tasks:

- [ ] Install and start WSO2 API Manager
- [ ] Access all three portals (Publisher, Developer, Admin)
- [ ] Import your OpenAPI spec or create API manually
- [ ] Configure endpoints pointing to your resource server
- [ ] Add OAuth 2.0 security with scopes
- [ ] Set rate limiting policies
- [ ] Publish the API
- [ ] Subscribe to API in Developer Portal
- [ ] Generate consumer key/secret
- [ ] Get access token and call API through gateway
- [ ] View analytics dashboard
- [ ] Test rate limiting (make 1000+ requests)
- [ ] Document WSO2 configuration in your project

## What You've Learned

By completing this phase, you now understand:

✅ How API gateways work
✅ API lifecycle management (create → publish → retire)
✅ OAuth 2.0 in an enterprise context
✅ Rate limiting and throttling
✅ API analytics and monitoring
✅ Developer portal for API consumers
✅ How to integrate WSO2 with custom auth servers

## Next Steps After WSO2

Once you're comfortable with WSO2:

1. **Explore Advanced Features**:
   - API monetization (charge for usage)
   - Multi-tenancy (multiple organizations)
   - Custom mediation policies (transform requests)
   - API revisions (rollback to previous versions)

2. **Integrate External Identity Providers**:
   - Google OAuth
   - Azure AD
   - Keycloak

3. **Automate with API Controller**:
   - Use `apictl` CLI to automate API publishing
   - Export/import APIs between environments

4. **Production Deployment**:
   - Set up high-availability WSO2 cluster
   - Configure external databases (MySQL/PostgreSQL)
   - Enable HTTPS with real certificates
   - Set up log monitoring and alerts

## Congratulations! 🎉

You've completed all five phases of the OAuth learning project. You now have:

1. ✅ Built REST APIs with proper design
2. ✅ Implemented OAuth 2.0 authorization flows
3. ✅ Added OpenID Connect for user identity
4. ✅ Created and validated JWT tokens
5. ✅ Deployed enterprise API management with WSO2

This is production-grade knowledge that companies pay for. You're ready to build secure, scalable API systems!

## Keep Learning

- Read OAuth 2.0 RFC: https://tools.ietf.org/html/rfc6749
- OpenID Connect spec: https://openid.net/connect/
- WSO2 documentation: https://apim.docs.wso2.com/
- Practice building more complex flows (PKCE, device flow)

You've got this! 🚀
