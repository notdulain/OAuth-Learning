const express = require('express');
const validateClient = require('../middleware/validate-client');
const { tokenHandler } = require('../controllers/token.controller');

const router = express.Router();

router.post('/', validateClient, tokenHandler);

module.exports = router;
