# Tasks: Security & Testing Foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~700-800 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Phase 1-2) → PR 2 (Phase 3) → PR 3 (Phase 4-5) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Test infra + bcrypt + service extraction | PR 1 | Base: main. Tests + core security + services. Self-contained. |
| 2 | Helmet + rate limiting + security tests | PR 2 | Base: main (stacked). Independent middleware layer. |
| 3 | Recovery token flow + model migration | PR 3 | Base: main (stacked). DB migration + new route. |

## Phase 1: Testing Infrastructure

- [x] 1.1 Add `vitest`, `supertest`, `@testing-library/react`, `jsdom` as devDependencies to `server/Back_PrograWeb/package.json` and `client/Front_PrograWeb/package.json`
- [x] 1.2 Create `server/Back_PrograWeb/vitest.config.js` (node environment, CJS support)
- [x] 1.3 Create `client/Front_PrograWeb/vitest.config.js` (jsdom environment, ESM)
- [x] 1.4 Add `"test": "vitest run"` scripts to both `package.json` files
- [ ] 1.5 Create `server/Back_PrograWeb/tests/setup.js` — bootstrap Express app via `require('../app')`, configure test DB sync

## Phase 2: Custom Errors + bcrypt + Service Layer

- [x] 2.1 Create `server/Back_PrograWeb/services/errors.js` — `AppError`, `AuthenticationError` (401), `ValidationError` (400), `NotFoundError` (404)
- [x] 2.2 Add `bcrypt` to `server/Back_PrograWeb/package.json` dependencies
- [x] 2.3 Create `server/Back_PrograWeb/services/AuthService.js` — `login` (bcrypt.compare + lazy migration fallback), `me`, `logout`, `generateRecoveryToken`
- [x] 2.4 Create `server/Back_PrograWeb/services/UserService.js` — `findAll`, `findById`, `create` (with bcrypt.hash), `changePassword`, `recoverPassword`, `#stripSensitive`
- [x] 2.5 Refactor `server/Back_PrograWeb/controllers/authController.js` — thin adapter delegating to `AuthService`, map custom errors to HTTP status
- [x] 2.6 Refactor `server/Back_PrograWeb/controllers/userController.js` — thin adapter delegating to `UserService`, remove `password` from `getUsers`/`getUserId`/`postUser` responses

## Phase 3: Security Middleware

- [ ] 3.1 Add `helmet` and `express-rate-limit` to `server/Back_PrograWeb/package.json`
- [ ] 3.2 Modify `server/Back_PrograWeb/app.js` — add `app.use(helmet())` after CORS, before routes
- [ ] 3.3 Create rate limiter in `server/Back_PrograWeb/app.js` — 5 req/min/IP, apply to `POST /auth/login` and `PUT /users/recoverpassword` routes

## Phase 4: Recovery Token Flow

- [ ] 4.1 Modify `server/Back_PrograWeb/models/User.js` — add `recovery_token` (UUID, nullable) and `recovery_token_expires` (DATE, nullable) columns
- [ ] 4.2 Add `POST /auth/recover` route in `server/Back_PrograWeb/routes/auth.js` → calls `AuthService.generateRecoveryToken(email)`
- [ ] 4.3 Modify `PUT /users/recoverpassword` in `server/Back_PrograWeb/routes/users.js` → accepts `{ token, newPassword }`, calls `UserService.recoverPassword(token, newPassword)`

## Phase 5: Testing & Verification

- [ ] 5.1 Create `server/Back_PrograWeb/tests/auth.test.js` — `POST /auth/login` (valid, invalid, inactive), `GET /auth/me` (unauthenticated), `POST /auth/logout`
- [ ] 5.2 Create `server/Back_PrograWeb/tests/user.test.js` — `POST /users` (201, no password), `GET /users` (no password in response), `GET /users/:id`
- [ ] 5.3 Create `server/Back_PrograWeb/tests/security.test.js` — Helmet headers present, rate limit returns 429 on 6th request, recovery token flow (generate + use + invalid token)
- [ ] 5.4 Run `npm test` in both backend and frontend — all tests pass, zero regressions

## Dependency Graph

```
1.1 ──→ 1.2 ──→ 1.3
                  └──→ 1.4 ──→ 1.5 ──→ 5.1, 5.2, 5.3, 5.4
2.1 ──→ 2.2 ──→ 2.3 ──→ 2.5 ──→ 5.1
              └──→ 2.4 ──→ 2.6 ──→ 5.2
3.1 ──→ 3.2 ──→ 3.3 ──→ 5.3
4.1 ──→ 2.3 (generateRecoveryToken)
4.1 ──→ 2.4 (recoverPassword)
4.2 ──→ 4.1
4.3 ──→ 4.1 ──→ 5.3
```

**Execution order**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (sequential). Phase 3 and 4 can run in parallel after Phase 2.
