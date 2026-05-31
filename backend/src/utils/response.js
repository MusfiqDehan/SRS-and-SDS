// Standard API response helpers. Every response follows the shape:
// { success: boolean, message: string, data: any, errors: any }

export function sendSuccess(res, { data = null, message = 'OK', status = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(res, { message = 'Something went wrong', status = 500, errors = null } = {}) {
  return res.status(status).json({ success: false, message, data: null, errors });
}

// Wrap async route handlers so rejected promises reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
