import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const protectRoute = async (req, res, next) => {
  if (req.auth().isAuthenticated) next();

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
  }
  return res
    .status(401)
    .json({ message: 'Unauthorized - you must be logeed in' });
};
