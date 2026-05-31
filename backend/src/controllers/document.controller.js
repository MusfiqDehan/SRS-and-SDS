import { query } from '../db/pool.js';
import { asyncHandler, sendSuccess, ApiError } from '../utils/response.js';

function mapSection(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    orderIndex: row.order_index,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocument(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findDocumentBySlug(slug) {
  const { rows } = await query('SELECT * FROM documents WHERE slug = $1', [slug]);
  if (rows.length === 0) {
    throw new ApiError(404, `Document "${slug}" not found`);
  }
  return rows[0];
}

// GET /api/documents
export const listDocuments = asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT * FROM documents ORDER BY id ASC');
  return sendSuccess(res, { message: 'Documents', data: rows.map(mapDocument) });
});

// GET /api/documents/:slug  (public — only published sections, ordered)
export const getDocument = asyncHandler(async (req, res) => {
  const doc = await findDocumentBySlug(req.params.slug);
  const includeUnpublished = req.query.all === 'true' && req.user?.role === 'admin';
  const sectionsResult = await query(
    `SELECT * FROM sections
     WHERE document_id = $1 ${includeUnpublished ? '' : 'AND is_published = TRUE'}
     ORDER BY order_index ASC, id ASC`,
    [doc.id]
  );
  return sendSuccess(res, {
    message: 'Document detail',
    data: { ...mapDocument(doc), sections: sectionsResult.rows.map(mapSection) },
  });
});

// PATCH /api/documents/:slug  (admin)
export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await findDocumentBySlug(req.params.slug);
  const { title, subtitle, description } = req.body || {};
  const { rows } = await query(
    `UPDATE documents
     SET title = COALESCE($2, title),
         subtitle = COALESCE($3, subtitle),
         description = COALESCE($4, description),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [doc.id, title ?? null, subtitle ?? null, description ?? null]
  );
  return sendSuccess(res, { message: 'Document updated', data: mapDocument(rows[0]) });
});

export { mapSection, mapDocument, findDocumentBySlug };
