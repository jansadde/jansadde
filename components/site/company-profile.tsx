import type { ArchiveFile, Category, Entry } from '@/lib/types';
import { Diamond, Photo } from './shared';
import { DocumentLibrary } from './documents';

export function CompanyProfile({ company, files, categories, index }: { company: Entry; files: ArchiveFile[]; categories: Category[]; index: number }) {
  const gallery = (company.gallery || []).filter(item => item.src);
  const fallback = company.id === 'company-tiffany' ? '/images/tiffany-study.svg' : '/images/kazakhyuvelir-study.svg';
  const image = company.image || gallery[0]?.src || fallback;
  const cover = gallery.find(item => item.src === image);
  const illustrative = image === fallback;
  const sources = company.sources || [];
  const galleryImages = gallery.filter(item => item.src !== image);

  return <section id={company.id} className={`company-study company-profile ${index % 2 ? 'company-study-emerald' : ''}`} aria-labelledby={`${company.id}-title`}>
    <div className="company-study-layout">
      <figure className="company-visual" data-reveal>
        <div><Photo src={image} alt={cover?.alt || (illustrative ? `Illustrative jewelry study for ${company.title}` : company.subtitle || company.title)} /><Diamond className="photo-diamond" /></div>
        <figcaption>{cover?.caption || (illustrative ? 'Illustrative jewelry study; not an official company photograph.' : 'Company image selected by the owner.')}{cover?.sourceUrl && <> <a href={cover.sourceUrl} target="_blank" rel="noreferrer">Image source</a></>}</figcaption>
      </figure>
      <article className="company-copy" data-reveal>
        <div className="company-profile-topline"><p className="eyebrow">COMPANY {String(index + 1).padStart(2, '0')} / {company.category}</p><Diamond className="section-diamond" /></div>
        <p className="company-founding">{company.period}</p>
        <h2 id={`${company.id}-title`}>{company.title}</h2>
        {company.subtitle && <p className="company-subtitle">{company.subtitle}</p>}
        {company.isExample && <span className="company-content-note">Editable company profile</span>}
        <p className="company-description prose">{company.description}</p>
        {company.link && <a className="text-link company-official-link" href={company.link} target="_blank" rel="noreferrer">Visit the official website</a>}
      </article>
    </div>

    {!!company.facts?.length && <dl className="company-facts">{company.facts.map((fact, i) => <div key={i}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}

    {!!company.sections?.length && <div className="company-editorial-grid">{company.sections.map((section, i) => <section className="company-editorial-block" key={i} data-reveal><div className="company-editorial-heading"><span>{String(i + 1).padStart(2, '0')}</span><h3>{section.heading}</h3><Diamond className="section-diamond" /></div><p className="prose">{section.body}</p></section>)}</div>}

    {!!company.timeline?.length && <section className="company-timeline" aria-labelledby={`${company.id}-timeline`}>
      <div className="company-section-heading"><div><p className="eyebrow">A HISTORY IN MOMENTS</p><h3 id={`${company.id}-timeline`}>Development timeline</h3></div><Diamond className="section-diamond" /></div>
      <ol className="company-timeline-list">{company.timeline.map((moment, i) => <li key={i}><span className="company-timeline-year">{moment.year}</span><div><h4>{moment.title}</h4><p>{moment.body}</p></div></li>)}</ol>
    </section>}

    {company.table && company.table.columns.length > 0 && <div className="company-table-wrap" role="region" aria-label={`${company.title} supporting information`} tabIndex={0}><table className="company-info-table"><thead><tr>{company.table.columns.map((column, i) => <th key={i} scope="col">{column}</th>)}</tr></thead><tbody>{company.table.rows.map((row, i) => <tr key={i}>{company.table!.columns.map((_, j) => <td key={j}>{row[j] || '—'}</td>)}</tr>)}</tbody></table></div>}

    {galleryImages.length > 0 && <section className="company-gallery" aria-labelledby={`${company.id}-gallery`}>
      <div className="company-section-heading"><div><p className="eyebrow">FORM, MATERIAL & CRAFT</p><h3 id={`${company.id}-gallery`}>Visual gallery</h3></div><Diamond className="section-diamond" /></div>
      <div className="company-gallery-grid">{galleryImages.map((item, i) => <figure key={i}><a href={item.src} target="_blank" rel="noreferrer" aria-label={`View image: ${item.alt}`}><Photo src={item.src} alt={item.alt} /></a><figcaption>{item.caption}{item.sourceUrl && <> <a href={item.sourceUrl} target="_blank" rel="noreferrer">Image source</a></>}</figcaption></figure>)}</div>
    </section>}

    {files.length > 0 && <section className="company-materials"><div className="company-section-heading"><h3>Company materials</h3><Diamond className="section-diamond" /></div><DocumentLibrary documents={files} categories={categories} compact /></section>}

    {(sources.length > 0 || company.result) && <section className="company-sources" aria-labelledby={`${company.id}-sources`}>
      <div className="company-section-heading"><div><p className="eyebrow">A TRACEABLE PROFILE</p><h3 id={`${company.id}-sources`}>Sources and references</h3></div><Diamond className="section-diamond" /></div>
      {company.result && <p className="company-research-note">{company.result}</p>}
      {sources.length > 0 && <ol className="company-sources-list">{sources.map((source, i) => <li id={`${company.id}-source-${i + 1}`} key={i}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ol>}
    </section>}
  </section>;
}
