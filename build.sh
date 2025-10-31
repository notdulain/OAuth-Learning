cd client-app

# Install additional dependencies
npm install axios react-router-dom

# Create folder structure
mkdir -p src/components
mkdir -p src/services
mkdir -p src/utils

# Create files
touch .env
touch README.md
touch src/components/Login.jsx
touch src/components/Dashboard.jsx
touch src/components/TokenDisplay.jsx
touch src/components/ApiTester.jsx
touch src/services/auth.service.js
touch src/services/api.service.js
touch src/utils/jwt-decoder.js