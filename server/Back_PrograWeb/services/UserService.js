const bcrypt = require('bcrypt');
const db = require('../models');
const { AuthenticationError, ValidationError, NotFoundError, ConflictError } = require('./errors');

const BCRYPT_ROUNDS = 10;

/**
 * UserService — CRUD for users, password management, recovery.
 * All methods strip sensitive fields (password, recovery_token) from returned data.
 */
class UserService {
  /**
   * Get all users with role info, password stripped.
   * @returns {Promise<Array<object>>}
   */
  static async findAll() {
    const users = await db.User.findAll({
      include: [
        { model: db.Role, as: 'role', attributes: ['role_name'] },
      ],
      limit: 1_000_000,
    });

    return users.map((user) => this.#stripSensitive(user.toJSON()));
  }

  /**
   * Get a single user by ID with role info, password stripped.
   * @param {number} id
   * @returns {Promise<object>}
   */
  static async findById(id) {
    const user = await db.User.findByPk(id, {
      include: [
        { model: db.Role, as: 'role', attributes: ['role_name'] },
      ],
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return this.#stripSensitive(user.toJSON());
  }

  /**
   * Create a new user. Validates required fields and email format.
   * Hashes the password before storing.
   * @param {object} data
   * @returns {Promise<object>}
   */
  static async create(data) {
    this.#validateCreateData(data);

    const hashedPassword = await this.#hashPassword(data.password);

    const userData = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      active: data.active !== undefined ? data.active : true,
      address: data.address || null,
      phone_number: data.phone_number || null,
      role_id: 2, // default: regular user
      fotoperfil: data.fotoperfil || 'https://res.cloudinary.com/dzqj1x3qk/image/upload/v1735686262/DefaultProfilePicture.png',
    };

    try {
      const newUser = await db.User.create(userData);
      return this.#stripSensitive(newUser.toJSON());
    } catch (error) {
      // Sequelize unique constraint violation → email already exists
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('El email ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Change a user's password. Verifies current password first.
   * @param {number} id
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<{ message: string }>}
   */
  static async changePassword(id, currentPassword, newPassword) {
    const user = await db.User.findByPk(id);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const isValid = await this.#comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new AuthenticationError('La contraseña actual es incorrecta.');
    }

    user.password = await this.#hashPassword(newPassword);
    await user.save();

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Recover password using a valid token.
   * Validates token and expiry, then updates password and clears the token.
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{ message: string }>}
   */
  static async recoverPassword(token, newPassword) {
    if (!token) {
      throw new ValidationError('Token de recuperación requerido');
    }

    const user = await db.User.findOne({ where: { recovery_token: token } });

    if (!user) {
      throw new AuthenticationError('Token de recuperación inválido');
    }

    if (user.recovery_token_expires && new Date(user.recovery_token_expires) < new Date()) {
      throw new AuthenticationError('Token de recuperación expirado');
    }

    user.password = await this.#hashPassword(newPassword);
    user.recovery_token = null;
    user.recovery_token_expires = null;
    await user.save();

    return { message: 'Contraseña recuperada exitosamente' };
  }

  /**
   * Toggle user active/inactive status.
   * @param {number} id
   * @param {boolean} active
   * @returns {Promise<object>}
   */
  static async toggleStatus(id, active) {
    const [updated] = await db.User.update(
      { active },
      { where: { id } },
    );

    if (!updated) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const updatedUser = await db.User.findByPk(id);
    return this.#stripSensitive(updatedUser.toJSON());
  }

  // ─── Private helpers ──────────────────────────────────────────────

  static async #hashPassword(plain) {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  static async #comparePassword(plain, stored) {
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      return bcrypt.compare(plain, stored);
    }
    return plain === stored;
  }

  static #stripSensitive(userOrData) {
    const { password, recovery_token, recovery_token_expires, ...rest } = userOrData;
    return rest;
  }

  static #validateCreateData(data) {
    if (!data.name || !data.email || !data.password) {
      throw new ValidationError('name, email y password son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('El formato del email no es válido');
    }
  }
}

module.exports = UserService;
