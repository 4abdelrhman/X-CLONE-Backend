import { aj } from '../config/arcjet';

export const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimited()) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({
          error: 'Bot access denied',
          message: 'Automated requests are not allowed.',
        });
      } else {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to this resource is forbidden.',
        });
      }

      if (
        decision.results.some(
          (results) => results.reason.isBot() && results.reason.isSpoofed()
        )
      ) {
        return res.status(403).json({
          error: 'Spoofed bot access denied',
          message: 'Spoofed bot access is not allowed.',
        });
        next();
      }
    }
  } catch (error) {
    console.error('Arcjet Middleware Error:', error);
    next();
  }
};
