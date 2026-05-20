const AuthService = require('../services/AuthService');
const { AuthenticationError } = require('../services/errors');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await AuthService.login(email, password);
    req.session.user = result.user;
    return res.json(result);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

const me = async (req, res) => {
  try {
    const result = AuthService.me(req.session?.user);
    return res.json(result);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

const logout = async (req, res) => {
  try {
    const result = await AuthService.logout(req.session);
    res.clearCookie('connect.sid');
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { login, me, logout };
