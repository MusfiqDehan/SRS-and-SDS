import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './pool.js';
import { migrate } from './migrate.js';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCUMENT_META = {
  sds: {
    title: 'Software Design Specification',
    subtitle: 'SDS',
    description:
      'Comprehensive software design documentation including class diagrams, sequence diagrams, ER diagrams, and implementation plans.',
  },
  srs: {
    title: 'Software Requirements Specification',
    subtitle: 'SRS',
    description:
      'Complete software requirements specification following IEEE Std 830-1998 standards.',
  },
};

async function seedAdmin(client) {
  const { name, email, password } = config.admin;
  const hash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, role = 'admin'`,
    [name, email.toLowerCase(), hash]
  );
}

async function seedContent(client) {
  const raw = await readFile(path.join(__dirname, 'content.json'), 'utf8');
  const content = JSON.parse(raw);

  for (const slug of Object.keys(DOCUMENT_META)) {
    const meta = DOCUMENT_META[slug];
    const docResult = await client.query(
      `INSERT INTO documents (slug, title, subtitle, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title,
             subtitle = EXCLUDED.subtitle,
             description = EXCLUDED.description,
             updated_at = NOW()
       RETURNING id`,
      [slug, meta.title, meta.subtitle, meta.description]
    );
    const documentId = docResult.rows[0].id;

    const sections = content[slug] || [];
    for (const section of sections) {
      await client.query(
        `INSERT INTO sections (document_id, slug, title, content, order_index, is_published)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (document_id, slug) DO UPDATE
           SET title = EXCLUDED.title,
               content = EXCLUDED.content,
               order_index = EXCLUDED.order_index,
               updated_at = NOW()`,
        [documentId, section.slug, section.title, section.content, section.order_index]
      );
    }
  }
}

export async function seed() {
  await migrate();
  await withTransaction(async (client) => {
    await seedAdmin(client);
    await seedContent(client);
  });
}

const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  seed()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Database seeded (admin user + SDS/SRS content).');
      return pool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
