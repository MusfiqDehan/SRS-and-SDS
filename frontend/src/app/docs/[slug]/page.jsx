'use client';

import { use } from 'react';
import DocViewer from '@/components/DocViewer';

export default function DocPage({ params }) {
  const { slug } = use(params);
  return <DocViewer slug={slug} />;
}
