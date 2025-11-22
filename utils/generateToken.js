import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const { JWT_SECRET, JWT_EXPIRES = '3h', REFRESH_EXPIRES = '24h' } = process.env;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');

export const signAccessToken = (userId, role, customExpiry = null) => {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, {
    expiresIn: customExpiry || JWT_EXPIRES,
    jwtid: crypto.randomUUID(),
  });
};

export const signRefreshToken = (userId) => {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    jwtid: crypto.randomUUID(),
  });
};

// default helper to create access token quickly
export default function generateToken(userId) {
  return signAccessToken(userId);
}
