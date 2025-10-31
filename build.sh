cd auth-server

# Create folder structure
mkdir -p src/config
mkdir -p src/routes
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/services
mkdir -p src/utils

# Create files
touch .env
touch README.md
touch src/index.js
touch src/config/oauth-config.js
touch src/routes/auth.routes.js
touch src/routes/token.routes.js
touch src/controllers/auth.controller.js
touch src/controllers/token.controller.js
touch src/middleware/validate-client.js
touch src/middleware/jwt-verify.js
touch src/services/jwt.service.js
touch src/services/oauth.service.js
touch src/services/openid.service.js
touch src/utils/token-generator.js
touch src/utils/crypto.js