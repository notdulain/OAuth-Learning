require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const tokenRouter = require('./routes/token.routes');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST_PORT = process.env.HOST_PORT || 8085;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    name: 'OAuth Learning Auth Server',
    docs: '/docs',
    token_endpoint: '/token',
    health: '/health'
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/token', tokenRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Auth server running on http://localhost:${HOST_PORT} (container port ${PORT})`
  );
});
