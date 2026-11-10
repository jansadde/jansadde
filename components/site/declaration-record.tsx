'use client';
import { useState } from 'react';
import type { ArchiveFile, Entry } from '@/lib/types';
import { FilePreview } from './documents';
import styles from './declaration-record.module.css';
export function DeclarationRecord({entry,files}:{entry:Entry;files:ArchiveFile[]}) {
  const [preview,setPreview]=useState(false);const content=entry.declaration!;
  const active=files.filter(file=>file.isPublic&&!file.deletedAt);
  const document=active.find(file=>file.id===entry.primaryFileId);
  const pdf=active.find(file=>file.id===entry.previewFileId&&file.mime==='application/pdf');
  return <div className={styles.record}>
    <div className={styles.overview}><div><p className="eyebrow">AI USE AND VERIFICATION RECORD</p><h2>Tools, evidence<br/><em>and my judgment.</em></h2><p className={styles.status}>{content.status}</p><p className={styles.prepared}>Prepared {content.preparedOn}</p></div><div className={styles.overviewText}><p>{content.scope}</p><div className={styles.actions}>{document&&<a className={styles.download} href={'/api/files/'+document.id+'?download=1'}>Download declaration</a>}{pdf&&<button type="button" onClick={()=>setPreview(true)}>Read document</button>}</div></div></div>
    <dl className={styles.details}>{content.details.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
    <div className={styles.layout}><nav className={styles.index} aria-label="Declaration sections">{content.blocks.map(block=><a key={block.id} href={'#declaration-'+block.id}><span>{block.id==='final'?'':block.id.toUpperCase()}</span>{block.title}</a>)}</nav>
      <div className={styles.blocks}>{content.blocks.map(block=><section className={styles.block} key={block.id} id={'declaration-'+block.id}><p className="eyebrow">{block.id==='final'?'STUDENT CONFIRMATION':'PART '+block.id.toUpperCase()}</p><h2>{block.title}</h2>{block.intro&&<p className={styles.intro}>{block.intro}</p>}
        {block.columns.length>0&&<div className={styles.tableWrap} tabIndex={0} role="region" aria-label={block.title+' table'}><table><thead><tr>{block.columns.map((column,i)=><th key={i} scope="col">{column}</th>)}</tr></thead><tbody>{block.rows.map((row,i)=><tr key={i}>{block.columns.map((_,j)=><td key={j}>{row[j]||''}</td>)}</tr>)}</tbody></table></div>}
        {block.paragraphs.map((paragraph,i)=>{const split=paragraph.indexOf('\n');return <div className={styles.paragraph} key={i}>{split>=0?<><h3>{paragraph.slice(0,split)}</h3><p>{paragraph.slice(split+1)}</p></>:<p>{paragraph}</p>}</div>})}
        {block.id==='e'&&<a className={styles.sourceLink} href="/evidence-folder#sources-references">Explore sources and references</a>}
      </section>)}</div>
    </div>
    {preview&&pdf&&<FilePreview file={pdf} onClose={()=>setPreview(false)}/>}
  </div>;
}
