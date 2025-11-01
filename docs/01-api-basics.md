# API Basics - Understanding the Foundation

This document explains how APIs work using simple language and practical examples. By the end, you'll understand how to build reliable APIs that follow industry standards.

## What is REST?

REST (Representational State Transfer) is a way to design APIs using simple HTTP requests. Think of it like ordering at a restaurant:

- **Resources** are the items on the menu (users, products, orders)
- **HTTP Methods** are the actions you can take (view, create, update, delete)
- **Responses** are what you get back (the food, or in our case, data)

### The Main HTTP Methods

Here's what each HTTP method does:

| Method | What It Does | Example |
|--------|--------------|---------|
| **GET** | Read/Fetch data | Get a list of users |
| **POST** | Create new data | Add a new user |
| **PUT** | Replace existing data completely | Update all user details |
| **PATCH** | Update part of existing data | Change just the user's email |
| **DELETE** | Remove data | Delete a user |

**Important Properties:**

- **Safe**: Doesn't change anything (only GET)
- **Idempotent**: Doing it multiple times has the same effect as doing it once (GET, PUT, DELETE)

## How to Design Good API Endpoints

### Rule 1: Use Clear Names
```
✅ Good: GET /api/users
❌ Bad: GET /api/getAllUsers

✅ Good: GET /api/products/123
❌ Bad: GET /api/getProductById?id=123
```

### Rule 2: Use Plurals for Collections
```
✅ /api/users          (collection of users)
✅ /api/users/42       (specific user)
✅ /api/products       (collection of products)
```

### Rule 3: Show Relationships with Nested Paths
```
✅ /api/products/123/reviews    (reviews for product 123)
✅ /api/users/42/orders         (orders for user 42)
```

### Rule 4: Use Query Parameters for Filtering
```
✅ /api/products?category=books&limit=10
✅ /api/users?role=admin&sort=name
```

## Understanding HTTP Requests and Responses

### A Typical Request Looks Like This:
```http
GET /api/products?limit=5 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGc...
Accept: application/json
```

**Breaking it down:**
- `GET` = the action we want
- `/api/products` = what we want to access
- `?limit=5` = we only want 5 items
- `Authorization` = our access token (like a ticket)
- `Accept` = we want JSON back

### A Typical Response Looks Like This:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": "prod_123",
      "name": "Learning OAuth 2.0",
      "price": 39.99
    }
  ],
  "pagination": {
    "limit": 5,
    "next": "/api/products?limit=5&cursor=abc"
  }
}
```

**Breaking it down:**
- `200 OK` = success!
- `Content-Type` = the response is JSON
- `data` = the actual products
- `pagination` = info to get the next page

## HTTP Status Codes - What They Mean

Think of status codes like traffic lights:

### Success (2xx) - Green Light
- **200 OK**: Everything worked, here's your data
- **201 Created**: New item was created successfully
- **204 No Content**: Success, but nothing to return

### Client Errors (4xx) - Red Light (Your Fault)
- **400 Bad Request**: You sent invalid data
- **401 Unauthorized**: You need to login first
- **403 Forbidden**: You're logged in, but not allowed to do this
- **404 Not Found**: The item doesn't exist
- **429 Too Many Requests**: Slow down! You're making too many requests

### Server Errors (5xx) - Red Light (Server's Fault)
- **500 Internal Server Error**: Something broke on the server
- **503 Service Unavailable**: Server is temporarily down

## Handling Errors Properly

When something goes wrong, return helpful error messages:

```json
{
  "type": "validation-error",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The email address is not valid",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email address"
    }
  ]
}
```

This helps developers understand exactly what went wrong and how to fix it.

## API Versioning - Handling Changes

As your API grows, you'll need to make changes. Versioning lets old apps keep working while new apps use new features.

### Three Common Approaches:

**1. URL Versioning (Easiest):**
```
/v1/users
/v2/users
```

**2. Query Parameter:**
```
/users?version=1
/users?version=2
```

**3. Header Versioning:**
```
Accept: application/json;version=1
```

**Recommendation**: Start with URL versioning (`/v1/users`) - it's the simplest to understand and implement.

## Pagination - Handling Large Lists

When you have thousands of users or products, you can't send them all at once. Use pagination:

### Simple Offset/Limit Method:
```
GET /api/users?offset=0&limit=10    (first 10 users)
GET /api/users?offset=10&limit=10   (next 10 users)
```

### Response Should Include Navigation:
```json
{
  "data": [ /* 10 users */ ],
  "pagination": {
    "offset": 0,
    "limit": 10,
    "total": 150,
    "next": "/api/users?offset=10&limit=10"
  }
}
```

## Security Basics

### 1. Always Use HTTPS
Never send passwords or tokens over plain HTTP. HTTPS encrypts everything.

### 2. Use Authentication Tokens
After login, give users a token they include in every request:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Check Permissions
Just because someone is logged in doesn't mean they can do everything. Check their role/permissions.

### 4. Enable CORS Properly
CORS lets browsers access your API from different domains. Configure it explicitly:
```javascript
// Allow requests from your React app
Access-Control-Allow-Origin: http://localhost:3000
```

### 5. Rate Limiting
Prevent abuse by limiting how many requests a user can make:
```
100 requests per hour per user
```

## Your First Implementation Tasks

Start by building these two simple endpoints:

### 1. Get All Users
```
GET /api/users

Response:
{
  "data": [
    { "id": 1, "name": "John", "email": "john@example.com" },
    { "id": 2, "name": "Jane", "email": "jane@example.com" }
  ]
}
```

### 2. Get One User
```
GET /api/users/1

Success Response (200):
{
  "id": 1,
  "name": "John",
  "email": "john@example.com"
}

Error Response (404):
{
  "error": "User not found"
}
```

## Phase 1 Checklist

Complete these tasks to finish the API basics phase:

- [ ] Create `GET /api/users` endpoint that returns a list of users
- [ ] Create `GET /api/users/:id` endpoint that returns one user
- [ ] Create `GET /api/products` endpoint that returns a list of products
- [ ] Return proper HTTP status codes (200 for success, 404 for not found)
- [ ] Handle errors gracefully with clear error messages
- [ ] Test all endpoints using Postman
- [ ] Document your API endpoints in a README file

## Key Takeaways

1. **REST is simple**: Use URLs to represent resources, HTTP methods to act on them
2. **Be consistent**: Pick naming patterns and stick to them
3. **Use proper status codes**: Help clients understand what happened
4. **Handle errors well**: Clear error messages save debugging time
5. **Think about the future**: Version your API from the start
6. **Security matters**: Always use HTTPS and validate permissions

## Next Steps

Once you're comfortable with basic APIs, you'll add authentication using JWT tokens in the next phase. This will let you protect your endpoints and control who can access what.

Remember: The best API is one that's predictable, consistent, and easy to understand. Take your time with the basics - they're the foundation for everything else!
