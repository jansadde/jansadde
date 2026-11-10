import type { Metadata } from 'next';
import { getPortfolio } from '@/lib/server';
import { SiteShell, Diamond, EmptyState } from '@/components/site/shared';
import { DocumentLibrary } from '@/components/site/documents';
import { CompanyProfile } from '@/components/site/company-profile';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Companies', description: 'Tiffany & Co. and KazakhYuvelir: company histories, leadership, jewelry, craftsmanship, and documented sources.' };

export default async function Companies() {
  const { profile, entries, documents, photos, categories } = await getPortfolio();
  const companies = entries.filter(entry => entry.kind === 'company' && entry.isPublic);
  const publicFiles = [...documents, ...photos].filter(file => file.isPublic && !file.deletedAt);
  const shared = publicFiles.filter(file => !file.projectId && file.categoryId === 'company-materials');

  return <SiteShell profile={profile}>
    <main id="main">
      <section className="companies-intro"><p className="eyebrow">HERITAGE, DESIGN & CRAFT</p><h1>Companies</h1><p className="companies-intro-copy">Two jewelry houses. Distinct histories, materials, and ways of giving form to meaning.</p><Diamond className="section-diamond" /><div className="companies-page-index">{companies.map((company, i) => <a key={company.id} href={`#${company.id}`}><span>{String(i + 1).padStart(2, '0')}</span>{company.title}</a>)}</div></section>
      <div className="company-collection">{companies.length ? companies.map((company, index) => <CompanyProfile key={company.id} company={company} files={publicFiles.filter(file => file.projectId === company.id)} categories={categories} index={index} />) : <section className="section"><EmptyState title="Company profiles" description="Published company profiles will appear here." /></section>}</div>
      {shared.length > 0 && <section className="section shared-company-materials" id="materials"><div className="company-section-heading"><h2>Shared materials</h2><Diamond className="section-diamond" /></div><DocumentLibrary documents={shared} categories={categories} /></section>}
    </main>
  </SiteShell>;
}
