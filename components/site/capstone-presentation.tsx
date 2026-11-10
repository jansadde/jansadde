'use client';
import { useState } from 'react';
import type { ArchiveFile,Entry } from '@/lib/types';
import { FilePreview,fileSize } from './documents';
import { PdfPreview } from './pdf-preview';
import styles from './capstone-presentation.module.css';
export function CapstonePresentation({entry,file,preview,appendix,appendixPreview}:{entry:Entry;file:ArchiveFile;preview?:ArchiveFile;appendix?:ArchiveFile;appendixPreview?:ArchiveFile}) {
 const [large,setLarge]=useState(false);const [showAppendix,setShowAppendix]=useState(false);const shown=preview||file;
 return <article className={styles.presentation} id="capstone-presentation">
  <div className={styles.viewer}><PdfPreview src={'/api/files/'+shown.id} name="Capstone presentation" pageLabel="Slide" showPageJump/></div>
  <div className={styles.actions}><div><span className="eyebrow">PRESENTATION PDF</span><p>{fileSize(file.size)} <span>·</span> Read the slides at your own pace</p></div><div><button type="button" onClick={()=>setLarge(true)}>View larger</button><a href={'/api/files/'+file.id+'?download=1'} download>Download presentation</a></div></div>
  {appendix&&<section className={styles.appendix} aria-label="Capstone Appendix"><div><span className="eyebrow">SUPPORTING MATERIAL</span><h2>Appendix</h2><p>Executive Summary Report <span>·</span> {fileSize(appendix.size)}</p></div><div><button type="button" onClick={()=>setShowAppendix(true)}>View appendix</button><a href={'/api/files/'+appendix.id+'?download=1'} download>Download appendix</a></div></section>}
  <footer className={styles.footer}><a href="/evidence-folder#sources-references">Sources & references</a><a href="/ai-declaration">AI Declaration</a></footer>
  {large&&<FilePreview file={shown} onClose={()=>setLarge(false)}/>}
  {showAppendix&&appendix&&<FilePreview file={appendixPreview||appendix} onClose={()=>setShowAppendix(false)}/>}
 </article>;
}
