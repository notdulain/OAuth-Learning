require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const usersRouter = require('./routes/users.routes');
const productsRouter = require('./routes/products.routes');

const app = express();
const PORT = process.env.PORT || 5000;

const jwtAuth = require('./middleware/jwt-auth');

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/users', jwtAuth, scopeCheck(['read:users']), usersRouter);
app.use('/api/products', productsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Resource server running on http://localhost:8080`);
});
