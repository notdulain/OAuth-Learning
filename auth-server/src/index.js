require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST_PORT = process.env.HOST_PORT || 8085;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Auth-server running on http://localhost:${HOST_PORT} (container port ${PORT})`
  );
});
