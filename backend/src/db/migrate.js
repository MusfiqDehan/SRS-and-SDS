import { pool } from './pool.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(40)  NOT NULL UNIQUE,
  title       VARCHAR(200) NOT NULL,
  subtitle    VARCHAR(300),
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
  id           SERIAL PRIMARY KEY,
  document_id  INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  slug         VARCHAR(120) NOT NULL,
  title        VARCHAR(250) NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_sections_document ON sections(document_id, order_index);
`;

export async function migrate() {
  await pool.query(SCHEMA);
}

const isMain = process.argv[1] && process.argv[1].endsWith('migrate.js');
if (isMain) {
  migrate()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Database schema is up to date.');
      return pool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
