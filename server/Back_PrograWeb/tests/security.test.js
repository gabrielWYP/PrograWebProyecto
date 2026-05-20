import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import app from '../app';

describe('Security Middleware', () => {
  describe('Helmet headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const res = await supertest(app).get('/');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-DNS-Prefetch-Control header', async () => {
      const res = await supertest(app).get('/');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('should include X-Frame-Options header', async () => {
      const res = await supertest(app).get('/');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should include Strict-Transport-Security header', async () => {
      const res = await supertest(app).get('/');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Rate limiter configuration', () => {
    it('should export authLimiter from middleware', async () => {
      const { authLimiter } = await import('../middleware/rateLimiter');
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });
  });
});
