import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError, ah } from '../utils/http.js';
import { User } from '../models/User.js';

export const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpires });

async function load(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new ApiError(401, 'Account not found or disabled');
  return user;
}

export const protect = ah(async (req, _res, next) => {
  const user = await load(req);
  if (!user) throw new ApiError(401, 'Please sign in to continue');
  req.user = user;
  next();
});

export const optionalAuth = ah(async (req, _res, next) => {
  try {
    req.user = await load(req);
  } catch {
    req.user = null;
  }
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have access to this resource'));
  next();
};
export const adminOnly = [protect, requireRole('admin', 'superadmin')];
export const superOnly = [protect, requireRole('superadmin')];
