import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  // 1. Try Clerk auth first
  if (req.auth && req.auth.userId) {
    const user = await User.findOne({ clerkId: req.auth.userId }).select(
      '-password'
    );
    if (!user)
      return res.status(404).json({ message: 'User not found (Clerk)' });

    req.user = user;
    req.userId = user._id;
    return next();
  }

  // 2. Try custom JWT auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Unauthorized - no token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found (JWT)' });

    req.user = user;
    req.userId = user._id;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
