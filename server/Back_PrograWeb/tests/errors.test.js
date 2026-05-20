import { describe, it, expect } from 'vitest';
import { AuthenticationError, ValidationError, NotFoundError, ConflictError, AppError } from '../services/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const err = new AppError('Something went wrong', 500);
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('should default to 401 status', () => {
      const err = new AuthenticationError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('No autenticado');
    });

    it('should accept custom message', () => {
      const err = new AuthenticationError('Credenciales inválidas');
      expect(err.message).toBe('Credenciales inválidas');
      expect(err.statusCode).toBe(401);
    });
  });

  describe('ValidationError', () => {
    it('should default to 400 status', () => {
      const err = new ValidationError();
      expect(err.statusCode).toBe(400);
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404 status', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should default to 409 status', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
    });
  });
});

describe('Backend test setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });
});
