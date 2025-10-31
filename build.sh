cd resource-server

# Create folder structure
mkdir -p src/routes
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/services

# Create files
touch .env
touch README.md
touch src/index.js
touch src/routes/users.routes.js
touch src/routes/products.routes.js
touch src/controllers/users.controller.js
touch src/controllers/products.controller.js
touch src/middleware/jwt-auth.js
touch src/middleware/scope-check.js
touch src/services/wso2-integration.service.js