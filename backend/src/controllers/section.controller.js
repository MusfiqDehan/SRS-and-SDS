import { query, withTransaction } from '../db/pool.js';
import { asyncHandler, sendSuccess, ApiError } from '../utils/response.js';
import { mapSection, findDocumentBySlug } from './document.controller.js';

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110) || `section-${Date.now()}`;
}

async function getSectionOr404(id) {
  const { rows } = await query('SELECT * FROM sections WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Section not found');
  }
  return rows[0];
}

// POST /api/documents/:slug/sections  (admin)
export const createSection = asyncHandler(async (req, res) => {
  const doc = await findDocumentBySlug(req.params.slug);
  const { title, content, isPublished } = req.body || {};
  if (!title || title.trim().length === 0) {
    throw new ApiError(422, 'Validation failed', { title: 'Title is required' });
  }

  let slug = req.body.slug ? slugify(req.body.slug) : slugify(title);
  // Ensure uniqueness within the document.
  const existing = await query(
    'SELECT 1 FROM sections WHERE document_id = $1 AND slug = $2',
    [doc.id, slug]
  );
  if (existing.rowCount > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const orderResult = await query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM sections WHERE document_id = $1',
    [doc.id]
  );
  const orderIndex = req.body.orderIndex ?? orderResult.rows[0].next;

  const { rows } = await query(
    `INSERT INTO sections (document_id, slug, title, content, order_index, is_published)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [doc.id, slug, title.trim(), content ?? '', orderIndex, isPublished ?? true]
  );
  return sendSuccess(res, {
    status: 201,
    message: 'Section created',
    data: mapSection(rows[0]),
  });
});

// PATCH /api/sections/:id  (admin)
export const updateSection = asyncHandler(async (req, res) => {
  const section = await getSectionOr404(req.params.id);
  const { title, content, orderIndex, isPublished } = req.body || {};
  const { rows } = await query(
    `UPDATE sections
     SET title = COALESCE($2, title),
         content = COALESCE($3, content),
         order_index = COALESCE($4, order_index),
         is_published = COALESCE($5, is_published),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      section.id,
      title ?? null,
      content ?? null,
      orderIndex ?? null,
      typeof isPublished === 'boolean' ? isPublished : null,
    ]
  );
  return sendSuccess(res, { message: 'Section updated', data: mapSection(rows[0]) });
});

// DELETE /api/sections/:id  (admin)
export const deleteSection = asyncHandler(async (req, res) => {
  const section = await getSectionOr404(req.params.id);
  await query('DELETE FROM sections WHERE id = $1', [section.id]);
  return sendSuccess(res, { message: 'Section deleted', data: { id: section.id } });
});

// PUT /api/documents/:slug/sections/reorder  (admin)
// body: { order: [sectionId, sectionId, ...] }
export const reorderSections = asyncHandler(async (req, res) => {
  const doc = await findDocumentBySlug(req.params.slug);
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order) {
    throw new ApiError(422, 'Validation failed', { order: 'order must be an array of section ids' });
  }
  await withTransaction(async (client) => {
    for (let i = 0; i < order.length; i += 1) {
      await client.query(
        'UPDATE sections SET order_index = $1, updated_at = NOW() WHERE id = $2 AND document_id = $3',
        [i + 1, order[i], doc.id]
      );
    }
  });
  const { rows } = await query(
    'SELECT * FROM sections WHERE document_id = $1 ORDER BY order_index ASC, id ASC',
    [doc.id]
  );
  return sendSuccess(res, { message: 'Sections reordered', data: rows.map(mapSection) });
});
