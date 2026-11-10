import type { Metadata } from 'next';
import { DocumentPage } from '@/components/site/document-page';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Artifacts' };
export default function Artifacts() { return <DocumentPage section="artifacts" />; }
