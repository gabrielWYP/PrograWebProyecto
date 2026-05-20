const UserService = require('../services/UserService');
const { ValidationError, AuthenticationError, NotFoundError, ConflictError } = require('../services/errors');

/** Map custom errors to HTTP status codes. */
function handleError(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

const getUsers = async (req, res) => {
  try {
    const usuarios = await UserService.findAll();
    res.status(200).json({ usuarios });
  } catch (error) {
    handleError(res, error);
  }
};

const getUserId = async (req, res) => {
  try {
    const usuario = await UserService.findById(Number(req.params.id));
    res.status(200).json(usuario);
  } catch (error) {
    handleError(res, error);
  }
};

const postUser = async (req, res) => {
  try {
    const user = await UserService.create(req.body);
    res.status(201).json({ message: 'Usuario creado exitosamente', user });
  } catch (error) {
    handleError(res, error);
  }
};

const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const user = await UserService.toggleStatus(Number(id), active);
    res.status(200).json({ message: 'Estado de usuario actualizado exitosamente', user });
  } catch (error) {
    handleError(res, error);
  }
};

const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const result = await UserService.changePassword(Number(id), currentPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const recoverPassword = async (req, res) => {
  const { email, newPassword, token } = req.body;

  try {
    // If token is provided, use token-based recovery (Phase 4)
    if (token) {
      const result = await UserService.recoverPassword(token, newPassword);
      return res.status(200).json(result);
    }

    // Legacy: email-based recovery (no token) — for backward compatibility
    // This path will be removed once all clients use token-based recovery
    const result = await UserService.recoverPassword(null, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getUsers, getUserId, postUser, cambiarEstado, changePassword, recoverPassword };
