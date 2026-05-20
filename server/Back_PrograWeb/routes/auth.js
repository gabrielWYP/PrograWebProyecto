const express = require('express');
const router = express.Router();
const { login, me, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.get('/me', me);
router.post('/logout', logout);

module.exports = router;
