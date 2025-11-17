const express = require('express');
const {
  discoveryDocument,
  jwksHandler,
  userInfoHandler
} = require('../controllers/oidc.controller');

const router = express.Router();

router.get('/.well-known/openid-configuration', discoveryDocument);
router.get('/.well-known/jwks.json', jwksHandler);
router.get('/userinfo', userInfoHandler);

module.exports = router;
