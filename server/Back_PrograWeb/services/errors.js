/**
 * Base application error with HTTP status code.
 * All custom errors extend this class.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication failures (401) — wrong credentials, inactive user, expired token.
 */
class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

/**
 * Validation failures (400) — missing fields, bad email format, etc.
 */
class ValidationError extends AppError {
  constructor(message = 'Datos inválidos') {
    super(message, 400);
  }
}

/**
 * Resource not found (404) — user, role, etc.
 */
class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Conflict errors (409) — duplicate email, etc.
 */
class ConflictError extends AppError {
  constructor(message = 'Conflicto de recursos') {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
};
