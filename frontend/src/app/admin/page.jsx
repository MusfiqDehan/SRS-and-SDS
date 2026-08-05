'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DocsApi } from '@/lib/api';
import { Icon } from '@/components/icons';

export default function AdminDashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await DocsApi.list();
        const detailed = await Promise.all(
          list.map(async (d) => {
            const full = await DocsApi.get(d.slug, { all: true });
            return { ...d, sectionCount: full.sections.length };
          })
        );
        setDocs(detailed);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Manage the content of your SDS and SRS documents. Changes appear instantly on the site.
        </p>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {docs.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white">
                  {d.subtitle}
                </span>
                <span className="text-sm text-[var(--muted)]">{d.sectionCount} sections</span>
              </div>
              <h2 className="mt-3 text-xl font-bold">{d.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{d.description}</p>
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/admin/documents/${d.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  <Icon.Edit className="h-4 w-4" /> Manage
                </Link>
                <Link
                  href={`/docs/${d.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:border-[var(--accent)]"
                >
                  Preview
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
