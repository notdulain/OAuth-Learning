const express = require('express');
const { listProducts } = require('../controllers/products.controller');

const router = express.Router();

router.get('/', listProducts);

module.exports = router;
