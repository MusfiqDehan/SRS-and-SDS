import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { asyncHandler, sendSuccess, ApiError } from '../utils/response.js';
import { signToken } from '../utils/token.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function issueToken(user) {
  return signToken({ sub: user.id, role: user.role });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'A valid email is required';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount > 0) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // The very first registered user becomes an admin so the platform is usable.
  const { rows: countRows } = await query('SELECT COUNT(*)::int AS count FROM users');
  const role = countRows[0].count === 0 ? 'admin' : 'user';

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name.trim(), normalizedEmail, hash, role]
  );
  const user = rows[0];
  return sendSuccess(res, {
    status: 201,
    message: 'Registration successful',
    data: { user: publicUser(user), token: issueToken(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(422, 'Email and password are required');
  }
  const { rows } = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return sendSuccess(res, {
    message: 'Login successful',
    data: { user: publicUser(user), token: issueToken(user) },
  });
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: 'Current user', data: { user: req.user } });
});
