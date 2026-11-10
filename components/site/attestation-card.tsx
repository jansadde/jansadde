'use client';
import { useState } from 'react';
import type { ArchiveFile, Entry } from '@/lib/types';
import { FilePreview, fileUrl, fileSize, fileType } from './documents';
import { PdfPreview } from './pdf-preview';
import styles from '@/app/attestations/attestations.module.css';

export function AttestationCard({entry,files,ordinal}:{entry:Entry;files:ArchiveFile[];ordinal:number}) {
  const [preview,setPreview]=useState<ArchiveFile|null>(null);
  const [slide,setSlide]=useState(0);
  const available=files.filter(file=>file.isPublic&&!file.deletedAt);
  const primary=available.find(file=>file.id===entry.primaryFileId);
  const supporting=available.find(file=>file.id===entry.supportingFileId);
  const pdf=available.find(file=>file.id===entry.previewFileId&&file.mime==='application/pdf') || (primary?.mime==='application/pdf'?primary:undefined);
  const images=available.filter(file=>file.projectId===entry.id&&file.mime.startsWith('image/')&&file.id!==supporting?.id).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  const current=images[Math.min(slide,Math.max(0,images.length-1))];
  const supportLabel=entry.id==='attestation-a2'?'Script':'Appendix';
  return <article className={styles.card} id={entry.id}>
    <header className={styles.cardHeader}><div><p className={styles.eyebrow}>ATTESTATION A{ordinal}</p><h2>{entry.title}</h2></div><p>{entry.description}</p></header>
    <div className={styles.stage}>
      {primary?.mime==='video/mp4'?<video className={styles.video} controls playsInline preload="metadata" aria-label={entry.title} src={fileUrl(primary)} poster={entry.image || undefined} />:
      current?<div className={styles.gallery}><img src={fileUrl(current)} alt={current.description||current.name} width={1536} height={864} loading="lazy" /><div className={styles.galleryControls}><button disabled={slide===0} onClick={()=>setSlide(n=>n-1)}>Previous</button><span aria-live="polite">{Math.min(slide+1,images.length)} / {images.length}</span><button disabled={slide>=images.length-1} onClick={()=>setSlide(n=>n+1)}>Next</button></div><p className={styles.slideCaption}>{current.description||current.name}</p></div>:
      pdf?<div className={styles.pdf}><PdfPreview src={fileUrl(pdf)} name={entry.title} /></div>:
      primary?<div className={styles.documentCover}><span>A{ordinal}</span><h3>{entry.title}</h3><p>{fileType(primary)} · {fileSize(primary.size)}</p><button className={styles.primaryButton} onClick={()=>setPreview(primary)}>Open document</button></div>:<p className={styles.empty}>No public artifact uploaded yet.</p>}
    </div>
    {primary&&<div className={styles.mainActions}><span>Main artifact <small>{fileType(primary)} · {fileSize(primary.size)}</small></span><div>{pdf&&<button onClick={()=>setPreview(pdf)}>Read in full</button>}<a className={styles.primaryButton} href={fileUrl(primary,true)} download>Download {entry.id==='attestation-a3'?'photo essay':entry.id==='attestation-a2'?'video':'document'}</a></div></div>}
    <section className={styles.support} aria-label={`${entry.title} ${supportLabel}`}><div><span className={styles.eyebrow}>SUPPORTING MATERIAL</span><h3>{supportLabel}</h3>{supporting&&<p>{supporting.name}</p>}</div>{supporting?<div className={styles.supportActions}><button onClick={()=>setPreview(supporting)}>View {supportLabel.toLowerCase()}</button><a href={fileUrl(supporting,true)} download>Download {supportLabel.toLowerCase()}</a></div>:<p className={styles.empty}>No public {supportLabel.toLowerCase()} uploaded yet.</p>}</section>
    {(!!entry.sections?.length||!!entry.result)&&<details className={styles.development}><summary>Development note</summary><div>{entry.result&&<p>{entry.result}</p>}{entry.sections?.map((section,index)=><div key={index}><h4>{section.heading}</h4><p>{section.body}</p></div>)}</div></details>}
    <FilePreview file={preview} onClose={()=>setPreview(null)} />
  </article>;
}
