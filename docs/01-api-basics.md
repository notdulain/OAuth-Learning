# API Foundations

This phase gives you the vocabulary you need to reason about the OAuth stack you will build later. Focus on understanding how HTTP works, how to model resources, and how to return predictable responses that clients can rely on.

## REST in a Nutshell

- **Resources** represent nouns in your domain (`/users`, `/products/42/reviews`).
- **Representations** are the JSON (or XML, etc.) documents sent back and forth.
- **Uniform interface** means you reuse the same HTTP methods everywhere:

| Method | Typical Use Case               | Safe | Idempotent | Request Body | Response Body |
|--------|--------------------------------|------|------------|--------------|----------------|
| `GET`  | Fetch one or many resources    | ✔︎   | ✔︎         | ❌           | Often ✔︎       |
| `POST` | Create sub-resources or actions| ❌   | ❌         | ✔︎           | ✔︎             |
| `PUT`  | Replace an entire resource     | ❌   | ✔︎         | ✔︎           | Optional       |
| `PATCH`| Apply a partial update         | ❌   | Depends*   | ✔︎           | Optional       |
| `DELETE`| Remove a resource             | ❌   | ✔︎         | Usually ❌   | Optional       |

\* Idempotent if you design the semantics carefully (same `PATCH` payload = same end state).

## Designing Endpoints

1. **Name resources with plurals**: `GET /api/users`, `GET /api/products/123`.
2. **Model relationships** with nested paths when it clarifies intent: `GET /api/products/123/reviews`.
3. **Use query parameters** for filtering, sorting, and pagination: `/api/products?category=books&limit=10`.
4. **Prefer nouns to verbs** in URLs; reserve verbs for rare action endpoints such as `/api/users/123/activate`.

### Request Anatomy

```
GET /api/products?limit=5 HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>
Accept: application/json
```

### Response Anatomy

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{
  "data": [
    {
      "id": "prod_123",
      "name": "Learning OAuth 2.0",
      "price": 39.99
    }
  ],
  "pagination": { "limit": 5, "next": "/api/products?limit=5&cursor=abc" }
}
```

Be explicit about the contract: content type, response shape, and behaviors like caching.

## Status Codes That Matter

| Group | Purpose | Common Values |
|-------|---------|---------------|
| 1xx   | Informational (rare in APIs) | — |
| 2xx   | Success | `200 OK`, `201 Created`, `204 No Content` |
| 3xx   | Redirects | `302 Found`, `304 Not Modified` |
| 4xx   | Client errors | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests` |
| 5xx   | Server errors | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

Pick the most specific code you can so clients can react intelligently.

## Consistent Error Handling

Structure error payloads so the frontend, Postman scripts, and WSO2 policies can decode them easily. The [RFC 7807 Problem Details](https://www.rfc-editor.org/rfc/rfc7807) format is a good starting point:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "email must be a valid address",
  "instance": "/api/users",
  "errors": [
    { "field": "email", "message": "is required" }
  ]
}
```

## Versioning Strategies

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URI segment | `/v1/users` | Easy to cache and route | URI churn, clients must migrate manually |
| Query string | `/users?version=1` | Minimal rewiring | Harder to cache, easy to forget |
| Header | `Accept: application/vnd.example.users+json;version=1` | Clean URLs, supports content negotiation | Requires header awareness and good documentation |

Pick one approach early (URI segments are the easiest while you learn) and stick with it.

## Pagination & Filtering Patterns

- **Offset/limit** (`?offset=30&limit=10`) is simple but may suffer under large data sets.
- **Cursor-based** pagination (`?cursor=abc123`) works better for real-time data.
- Always return enough metadata (`limit`, `total`, `next` URL) so clients can chain requests.

## Security Primer

- **HTTPS everywhere**—even in development, Docker can proxy TLS.
- **Authentication**: Start with bearer tokens issued by your auth server in Phase 2.
- **Authorization**: Enforce scopes/roles when you add `scope-check.js`.
- **CORS**: Configure explicitly so the React client and Postman behave predictably.
- **Rate limiting**: In Phase 5 WSO2 will enforce enterprise-grade limits.

## Checklist for Phase 1

- [ ] Implement `GET /api/users` and `GET /api/products` in the resource server.
- [ ] Return well-formed JSON with explicit status codes.
- [ ] Document the endpoints in this repo (README, Postman collection).
- [ ] Add at least one error scenario (e.g., `GET /api/users/:id` when the user does not exist).
- [ ] Capture notes or questions in this document as you iterate.

> **Tip:** Create sample data structures now; you will reuse them when validating scopes and claims later on.
