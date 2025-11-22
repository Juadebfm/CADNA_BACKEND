import express from 'express';
import {
  register, login, verify2faLogin,
  setup2fa, verify2faEnable, disable2fa,
  refresh, logout, me
} from '../controllers/authController.js';
import { extendExamToken } from '../controllers/examTokenController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a CADNA user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, password]
 *             properties:
 *               firstName:   { type: string }
 *               lastName:   { type: string }
 *               email:  { type: string }
 *               phone:  { type: string }
 *               password: { type: string }
 *               role:   { type: string, example: "student" }
 *               university: { type: string }
 *               studentId: { type: string }
 *     responses:
 *       '201':
 *         description: Registered (returns user id + accessToken)
 *       '400':
 *         description: Missing required fields
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login (may return a tempToken if 2FA required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       '200':
 *         description: Logged in or 2FA required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean }
 *                     message: { type: string }
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { type: object }
 *                         accessToken: { type: string }
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean }
 *                     message: { type: string }
 *                     data:
 *                       type: object
 *                       properties:
 *                         twoFARequired: { type: boolean }
 *                         tempToken: { type: string }
 *       '401':
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/verify-2fa-login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Complete 2FA login using tempToken + TOTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tempToken, code]
 *             properties:
 *               tempToken: { type: string }
 *               code: { type: string, description: '6-digit TOTP code' }
 *     responses:
 *       '200':
 *         description: 2FA verified — returns access token and user
 *       '401':
 *         description: Invalid temp token or code
 */
router.post('/verify-2fa-login', verify2faLogin);

/**
 * @openapi
 * /api/auth/setup-2fa:
 *   post:
 *     tags:
 *       - 2FA
 *     summary: Start 2FA setup (protected) — returns otpauth_url and optional qrDataURL
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: 2FA setup started (otpauth_url + qrDataURL)
 *       '401':
 *         description: Not authenticated
 */
router.post('/setup-2fa', protect, setup2fa);

/**
 * @openapi
 * /api/auth/verify-2fa-enable:
 *   post:
 *     tags:
 *       - 2FA
 *     summary: Confirm 2FA setup (protected) — provide TOTP code to enable
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       '200':
 *         description: 2FA enabled
 *       '400':
 *         description: No pending 2FA setup
 *       '401':
 *         description: Invalid code
 */
router.post('/verify-2fa-enable', protect, verify2faEnable);

/**
 * @openapi
 * /api/auth/disable-2fa:
 *   post:
 *     tags:
 *       - 2FA
 *     summary: Disable 2FA (protected). Provide password or one-time TOTP code.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *               code: { type: string }
 *     responses:
 *       '200':
 *         description: 2FA disabled
 *       '400':
 *         description: Missing verification (password or code)
 *       '401':
 *         description: Invalid password or code
 */
router.post('/disable-2fa', protect, disable2fa);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: "Rotate refresh token (cookie-based). In Swagger UI use Cookie header: jid=<refreshToken>"
 *     parameters:
 *       - in: header
 *         name: Cookie
 *         schema:
 *           type: string
 *         description: "Set 'jid=<refreshToken>' here to test in Swagger UI (httpOnly cookies cannot be set by UI)."
 *     responses:
 *       '200':
 *         description: New access token
 *       '401':
 *         description: No or invalid refresh token
 */
router.post('/refresh', refresh);


/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout (clears refresh cookie and blacklists access token if provided)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Logged out
 */
router.post('/logout', logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user (protected)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user returned
 *       '401':
 *         description: Not authenticated
 */
router.get('/me', protect, me);

/**
 * @openapi
 * /api/auth/extend-exam-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Extend token during active exam session
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId: { type: string }
 *     responses:
 *       '200':
 *         description: Token extended successfully
 *       '400':
 *         description: Invalid session or not active
 */
router.post('/extend-exam-token', protect, extendExamToken);

export default router;
