'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DocsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/icons';
import { exportHtml, exportDocx, exportPdf } from '@/lib/export';

const TABS = [
  { slug: 'sds', label: 'SDS' },
  { slug: 'srs', label: 'SRS' },
];

export default function DocViewer({ slug }) {
  const { user, isAdmin, logout } = useAuth();
  const { notify } = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    DocsApi.get(slug)
      .then((data) => {
        if (cancelled) return;
        setDoc(data);
        setActiveId(data.sections[0]?.slug || null);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Scroll spy for the active section highlight.
  useEffect(() => {
    const onScroll = () => {
      const sections = contentRef.current?.querySelectorAll('[data-section]') || [];
      let current = null;
      sections.forEach((el) => {
        if (window.scrollY >= el.offsetTop - 160) current = el.getAttribute('data-section');
      });
      if (current) setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [doc]);

  const scrollTo = (sectionSlug) => {
    const el = document.getElementById(`sec-${sectionSlug}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
      setActiveId(sectionSlug);
      setMenuOpen(false);
    }
  };

  const innerHtmlForExport = useMemo(() => {
    if (!doc) return '';
    return doc.sections
      .map((s) => `<h1>${s.title}</h1>${s.content}`)
      .join('\n');
  }, [doc]);

  const docName = (doc?.subtitle || slug).toUpperCase();

  const handleHtml = () => {
    exportHtml(doc.title, innerHtmlForExport, docName);
    notify(`${docName} downloaded as HTML`, 'success');
  };
  const handleDocx = () => {
    exportDocx(doc.title, innerHtmlForExport, docName);
    notify(`${docName} downloaded as DOCX`, 'success');
  };
  const handlePdf = () => {
    notify('Use the print dialog and choose "Save as PDF"');
    setTimeout(() => exportPdf(), 600);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top control bar */}
      <header className="no-print sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <Icon.Close className="h-5 w-5" /> : <Icon.Menu className="h-5 w-5" />}
          </button>

          <Link href="/docs/sds" className="flex items-center gap-2 font-bold">
            <Icon.Doc className="h-6 w-6 text-[var(--accent)]" />
            <span className="hidden sm:inline">SDS / SRS</span>
          </Link>

          <div className="ml-2 flex rounded-lg border border-[var(--border)] p-0.5">
            {TABS.map((tab) => (
              <Link
                key={tab.slug}
                href={`/docs/${tab.slug}`}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  slug === tab.slug
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1 md:flex">
              <ExportButton onClick={handlePdf} icon={<Icon.Print className="h-4 w-4" />} label="PDF" />
              <ExportButton onClick={handleHtml} icon={<Icon.Download className="h-4 w-4" />} label="HTML" />
              <ExportButton onClick={handleDocx} icon={<Icon.Doc className="h-4 w-4" />} label="DOCX" />
            </div>
            <ThemeToggle />
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
                  aria-label="Log out"
                >
                  <Icon.Logout className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--accent)]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <AnimatePresence>
          {(menuOpen || true) && (
            <aside
              className={`no-print ${
                menuOpen ? 'block' : 'hidden'
              } lg:block lg:w-64 lg:shrink-0`}
            >
              <nav className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  Contents
                </p>
                <ul className="space-y-1">
                  {doc?.sections.map((s, i) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(s.slug)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          activeId === s.slug
                            ? 'bg-[var(--accent)] text-white'
                            : 'hover:bg-[var(--bg)]'
                        }`}
                      >
                        <span className="mr-1.5 opacity-70">{i + 1}.</span>
                        {s.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="min-w-0 flex-1" ref={contentRef}>
          {loading && <SkeletonDoc />}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 dark:bg-red-950/30">
              <p className="font-semibold">Could not load this document.</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {doc && !loading && (
            <article>
              <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {doc.subtitle}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold">{doc.title}</h1>
                {doc.description && (
                  <p className="mt-2 max-w-2xl text-[var(--muted)]">{doc.description}</p>
                )}
              </motion.header>

              {doc.sections.length === 0 && (
                <p className="text-[var(--muted)]">No sections published yet.</p>
              )}

              {doc.sections.map((s, i) => (
                <motion.section
                  key={s.id}
                  id={`sec-${s.slug}`}
                  data-section={s.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.35 }}
                  className="mb-8 scroll-mt-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <h2 className="mb-3 text-2xl font-bold">
                    <span className="mr-2 text-[var(--accent)]">{i + 1}.</span>
                    {s.title}
                  </h2>
                  <div
                    className="doc-content"
                    // Content is authored by trusted admins via the dashboard.
                    dangerouslySetInnerHTML={{ __html: s.content }}
                  />
                </motion.section>
              ))}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}

function ExportButton({ onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {icon}
      {label}
    </button>
  );
}

function SkeletonDoc() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="mb-4 h-6 w-1/3 rounded bg-[var(--border)]" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-[var(--border)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--border)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--border)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
