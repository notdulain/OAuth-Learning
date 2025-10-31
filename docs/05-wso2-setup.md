# WSO2 API Manager Setup

In Phase 5 you elevate the project from a local OAuth playground to an enterprise-style deployment managed by WSO2 API Manager. This guide walks through the environment setup, core configuration, and how to integrate the gateway with your auth and resource servers.

## Why WSO2?

- **Full API lifecycle**: Design → publish → monetize flows in one tool.
- **Built-in security**: OAuth 2.0 / OIDC provider, API key management, throttling, analytics.
- **Developer experience**: Publisher and Developer Portal UIs that your consumers can self-serve from.

## Prerequisites

- Docker and Docker Compose installed.
- 8 GB RAM (minimum) free—WSO2 is JVM-based and memory hungry.
- Ports `9443`, `9763`, `8243`, and `8280` available.
- Auth and resource servers ready with working OAuth flows (from previous phases).

## Start the Stack

```bash
cd wso2-setup
docker-compose -f docker-compose-wso2.yml up -d
```

Once containers are healthy:

- Publisher Portal: https://localhost:9443/publisher
- Developer Portal: https://localhost:9443/devportal
- Admin Console: https://localhost:9443/carbon

Default credentials: `admin` / `admin`. Change them immediately in a long-running environment.

## Initial Configuration Checklist

1. **Update hostnames**: Edit `deployment.toml` to reflect `localhost` or your chosen domain.
2. **Enable HTTPS only**: Ensure transport configurations expose TLS endpoints.
3. **Create a tenant (optional)**: Stick to the super tenant while learning.
4. **Configure Key Manager**:
   - Set token issuer to match your auth server issuer (`http://localhost:4000`).
   - Configure JWKS URL if using RS256.
5. **API Throttling tiers**: Define Bronze/Silver/Gold tiers suited for your demo.

Restart the container after editing `deployment.toml`.

## Importing APIs

This project ships with OpenAPI specs you can import:

1. Login to the Publisher Portal.
2. Create a new API → **Import OpenAPI**.
3. Choose `wso2-setup/apis/user-api-swagger.yaml` or `product-api-swagger.yaml`.
4. Review resource paths and methods.
5. Configure **Endpoints**:
   - **Production**: `http://resource-server:5000/api` (use Docker service name in Compose).
   - **Sandbox**: Optional.
6. Assign throttling policy (e.g., Bronze).
7. Enable **Security**:
   - OAuth 2.0 (default) with scopes from your API spec.
   - Optionally enable API keys or mutual TLS for experimentation.
8. Save and **Publish**.

## Connecting to Your Auth Server

WSO2 can act as the authorization server, or it can trust an external one (yours). For learning, try both:

### Option A: Use WSO2 as the Authorization Server

- Register a new application in the Developer Portal.
- Generate consumer key/secret and callback URL.
- Configure the React client to use WSO2 endpoints.
- Use the built-in token endpoint (`https://localhost:9443/oauth2/token`).

### Option B: Delegate to Your Auth Server

- Configure WSO2 to validate tokens using your JWKS or introspection endpoint.
- Update `wso2-integration.service.js` to call WSO2 for analytics while trusting your tokens.
- Useful when you want to keep custom login UX but gain gateway features.

## Analytics & Observability

WSO2 provides dashboards for:

- Request counts and latencies.
- Throttling events.
- Faulty invocations.

Enable analytics in `deployment.toml` and restart. You may need to persist data in an external database for richer dashboards.

## Rate Limiting & Policies

- Define application-level tiers (e.g., 1000 requests/day).
- Define resource-level throttling for sensitive endpoints (e.g., `/users` → 10 req/min).
- Use custom mediation policies to inject headers or perform transformations.

## Integration Steps in This Project

- [ ] Ensure Docker network in `docker-compose.yml` links `auth-server`, `resource-server`, `client-app`, and WSO2 containers.
- [ ] Update `resource-server/src/services/wso2-integration.service.js` to call WSO2 token validation or analytics endpoints.
- [ ] Configure CORS and gateway responses to align with the frontend expectations.
- [ ] Add Postman requests targeting the WSO2 gateway (`https://localhost:8243/<context>`).
- [ ] Document throttling and subscription requirements for each API.

## Troubleshooting Guide

| Symptom | Possible Cause | Fix |
|---------|----------------|-----|
| Cannot reach portals | Certificates not trusted | Import WSO2 self-signed cert into browser/system trust store. |
| Token validation fails | Mismatch in issuer/audience | Align `iss` claim and application key manager settings. |
| 401 from gateway | Application not subscribed or wrong scope | Subscribe the app and request the correct scopes when fetching tokens. |
| High CPU usage | JVM heap defaults too low | Tune `JVM_MEM_OPTS` in `docker-compose-wso2.yml`. |
| Gateway cannot reach resource server | Networking issues | Ensure both containers share the Docker network and use service names, not `localhost`. |

## Next Steps

- Experiment with multiple environments (Dev / Prod) using separate API revisions.
- Automate API import using the WSO2 API Controller (`apictl`) CLI.
- Explore monetization and subscription workflows for premium APIs.
- Integrate external identity providers (Keycloak, Azure AD) once you master the internal flow.

> **Pro Tip:** Keep a change log in this file as you tweak `deployment.toml` or gateway policies. Enterprise gateways have many knobs—documenting them saves hours of debugging later.
