import { ApiError, sendError } from '../utils/response.js';
import { verifyToken } from '../utils/token.js';
import { query } from '../db/pool.js';

// Attaches the authenticated user to req.user. Throws 401 when missing/invalid.
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }
    const decoded = verifyToken(token);
    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (result.rowCount === 0) {
      throw new ApiError(401, 'User no longer exists');
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Restrict a route to one or more roles. Must run after authenticate.
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

// Centralised error handler. Keep last in the middleware chain.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return sendError(res, {
    status,
    message: err.message || 'Internal server error',
    errors: err.errors || null,
  });
}

export function notFound(_req, res) {
  return sendError(res, { status: 404, message: 'Resource not found' });
}
