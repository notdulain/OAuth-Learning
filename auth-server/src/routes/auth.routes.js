const express = require('express');
const {
  authorizationEndpoint,
  loginHandler,
  consentHandler,
  logoutHandler
} = require('../controllers/auth.controller');

const router = express.Router();

router.get('/authorize', authorizationEndpoint);
router.post('/login', loginHandler);
router.post('/consent', consentHandler);
router.post('/logout', logoutHandler);

module.exports = router;
