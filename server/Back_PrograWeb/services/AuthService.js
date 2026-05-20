const bcrypt = require('bcrypt');
const db = require('../models');
const { AuthenticationError, NotFoundError } = require('./errors');

const BCRYPT_ROUNDS = 10;

/**
 * AuthService — login, me, logout, recovery token generation.
 * Handles lazy bcrypt migration: if stored password is plain text,
 * it compares directly then re-saves as a bcrypt hash.
 */
class AuthService {
  /**
   * Authenticate user by email + password.
   * Supports lazy migration from plain-text passwords.
   * @param {string} email
   * @param {string} password
   * @returns {{ user: object }}
   */
  static async login(email, password) {
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      throw new AuthenticationError('Usuario o contraseña incorrectos');
    }

    if (!user.active) {
      throw new AuthenticationError('Usuario desactivado');
    }

    const isValid = await this.#comparePassword(password, user.password);

    if (!isValid) {
      throw new AuthenticationError('Usuario o contraseña incorrectos');
    }

    // Lazy migration: if password was plain text, re-hash it now
    if (!this.#isBcryptHash(user.password)) {
      user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await user.save();
    }

    const userData = this.#stripSensitive(user.toJSON());
    return { user: userData };
  }

  /**
   * Return the current session user.
   * @param {object} sessionUser — from req.session.user
   * @returns {{ user: object }}
   */
  static me(sessionUser) {
    if (!sessionUser) {
      throw new AuthenticationError('No autenticado');
    }
    return { user: this.#stripSensitive(sessionUser) };
  }

  /**
   * Destroy the session.
   * @param {object} session — express session
   * @returns {Promise<{ message: string }>}
   */
  static logout(session) {
    return new Promise((resolve, reject) => {
      session.destroy((err) => {
        if (err) {
          reject(new Error('Error al cerrar sesión'));
          return;
        }
        resolve({ message: 'Sesión cerrada correctamente' });
      });
    });
  }

  /**
   * Generate a recovery token for the user with the given email.
   * (Prepares for Phase 4 — token stored in DB, returned in response for now.)
   * @param {string} email
   * @returns {{ token: string }}
   */
  static async generateRecoveryToken(email) {
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundError('No existe un usuario con este correo electrónico');
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.recovery_token = token;
    user.recovery_token_expires = expires;
    await user.save();

    return { token };
  }

  // ─── Private helpers ──────────────────────────────────────────────

  /**
   * Compare plain-text password against stored hash.
   * Falls back to plain-text comparison for lazy migration.
   */
  static async #comparePassword(plain, stored) {
    if (this.#isBcryptHash(stored)) {
      return bcrypt.compare(plain, stored);
    }
    // Lazy migration fallback: plain-text comparison
    return plain === stored;
  }

  /**
   * Check if a string looks like a bcrypt hash.
   */
  static #isBcryptHash(value) {
    return value.startsWith('$2b$') || value.startsWith('$2a$');
  }

  /**
   * Remove password (and other sensitive fields) from a user object.
   */
  static #stripSensitive(userOrData) {
    const { password, recovery_token, recovery_token_expires, ...rest } = userOrData;
    return rest;
  }
}

module.exports = AuthService;
