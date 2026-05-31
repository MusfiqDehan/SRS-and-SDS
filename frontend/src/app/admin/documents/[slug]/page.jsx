'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DocsApi } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/icons';

export default function ManageDocumentPage({ params }) {
  const { slug } = use(params);
  const { notify } = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // section being edited or 'new'
  const [meta, setMeta] = useState({ title: '', subtitle: '', description: '' });

  const load = useCallback(async () => {
    const data = await DocsApi.get(slug, { all: true });
    setDoc(data);
    setMeta({ title: data.title, subtitle: data.subtitle || '', description: data.description || '' });
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMeta = async () => {
    try {
      await DocsApi.updateDocument(slug, meta);
      notify('Document details saved', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const togglePublish = async (section) => {
    try {
      await DocsApi.updateSection(section.id, { isPublished: !section.isPublished });
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const removeSection = async (section) => {
    if (!window.confirm(`Delete section "${section.title}"?`)) return;
    try {
      await DocsApi.deleteSection(section.id);
      notify('Section deleted', 'success');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const move = async (index, dir) => {
    if (!doc) return;
    const order = doc.sections.map((s) => s.id);
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    try {
      await DocsApi.reorder(slug, order);
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const onSaved = () => {
    setEditing(null);
    load();
  };

  if (loading) return <p className="text-[var(--muted)]">Loading…</p>;

  return (
    <div>
      <Link href="/admin" className="text-sm font-semibold text-[var(--accent)]">
        ← Back to documents
      </Link>

      {/* Document meta editor */}
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-2xl font-extrabold">Edit {doc.subtitle} document</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LabeledInput label="Title" value={meta.title} onChange={(v) => setMeta({ ...meta, title: v })} />
          <LabeledInput label="Subtitle / short code" value={meta.subtitle} onChange={(v) => setMeta({ ...meta, subtitle: v })} />
        </div>
        <LabeledTextarea
          label="Description"
          value={meta.description}
          onChange={(v) => setMeta({ ...meta, description: v })}
          rows={2}
        />
        <button
          type="button"
          onClick={saveMeta}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Save details
        </button>
      </div>

      {/* Sections */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">Sections ({doc.sections.length})</h2>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          <Icon.Plus className="h-4 w-4" /> Add section
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {doc.sections.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[var(--muted)] disabled:opacity-30">
                <Icon.Up className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === doc.sections.length - 1}
                className="text-[var(--muted)] disabled:opacity-30"
              >
                <Icon.Down className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                <span className="mr-1.5 text-[var(--muted)]">{i + 1}.</span>
                {s.title}
              </p>
              <p className="truncate text-xs text-[var(--muted)]">/{s.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => togglePublish(s)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                s.isPublished ? 'bg-emerald-500 text-white' : 'bg-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {s.isPublished ? 'Published' : 'Hidden'}
            </button>
            <button type="button" onClick={() => setEditing(s)} className="rounded-lg border border-[var(--border)] p-2 hover:border-[var(--accent)]">
              <Icon.Edit className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => removeSection(s)} className="rounded-lg border border-[var(--border)] p-2 text-red-500 hover:border-red-400">
              <Icon.Trash className="h-4 w-4" />
            </button>
          </div>
        ))}
        {doc.sections.length === 0 && <p className="text-[var(--muted)]">No sections yet. Add your first one.</p>}
      </div>

      <AnimatePresence>
        {editing && (
          <SectionEditor
            slug={slug}
            section={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionEditor({ slug, section, onClose, onSaved }) {
  const { notify } = useToast();
  const isNew = !section;
  const [title, setTitle] = useState(section?.title || '');
  const [content, setContent] = useState(section?.content || '');
  const [isPublished, setIsPublished] = useState(section?.isPublished ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      notify('Title is required', 'error');
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        await DocsApi.createSection(slug, { title, content, isPublished });
        notify('Section created', 'success');
      } else {
        await DocsApi.updateSection(section.id, { title, content, isPublished });
        notify('Section updated', 'success');
      }
      onSaved();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <h3 className="text-xl font-bold">{isNew ? 'Add section' : 'Edit section'}</h3>
        <div className="mt-4 space-y-4">
          <LabeledInput label="Title" value={title} onChange={setTitle} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Content (HTML supported)</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-sm outline-none focus:border-[var(--accent)]"
              placeholder="<p>Write your section content here. HTML tags are supported.</p>"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Published (visible on the public site)
          </label>

          {content && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--muted)]">Live preview</p>
              <div
                className="doc-content max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save section'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LabeledInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}

function LabeledTextarea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
