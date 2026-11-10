'use client';
import { useState } from 'react';
import type { ArchiveFile, SourceReference } from '@/lib/types';
import { referenceGroups, referenceWorkLabel } from '@/lib/references';
import styles from './reference-library.module.css';

export function ReferenceLibrary({references, files}: {references:SourceReference[]; files:ArchiveFile[]}) {
  const [query,setQuery]=useState('');const [group,setGroup]=useState('All sources');const [work,setWork]=useState('');
  const activeFiles=files.filter(file=>file.isPublic&&!file.deletedAt);
  const fileMap=new Map(activeFiles.map(file=>[file.id,file]));
  const works=activeFiles.filter(file=>references.some(reference=>reference.fileIds.includes(file.id))).sort((a,b)=>referenceWorkLabel(a).localeCompare(referenceWorkLabel(b), 'en', {numeric:true}));
  const matches=references.filter(reference=>{
    const words=[reference.title,reference.publisher,reference.note,reference.url,...reference.fileIds.map(id=>fileMap.has(id)?referenceWorkLabel(fileMap.get(id)!):'')].join(' ').toLowerCase();
    return (!query.trim()||words.includes(query.trim().toLowerCase()))&&(!work||reference.fileIds.includes(work));
  });
  const shown=matches.filter(reference=>group==='All sources'||reference.group===group);
  const groups=referenceGroups.filter(name=>references.some(reference=>reference.group===name));
  return <div className={styles.library}>
    <div className={styles.intro}><div><p className="eyebrow">THE REFERENCE COLLECTION</p><h2>Resources behind<br/><em>every perspective.</em></h2></div><p>Browse the original references and the additional verification resources identified in the source review. Each entry explains its scope and where it is cited.</p></div>
    <div className={styles.stats}><span><strong>{references.length}</strong> sources</span><span><strong>{groups.length}</strong> collections</span><span><strong>{works.length}</strong> cited works</span></div>
    <div className={styles.controls}><label>Search the collection<input type="search" placeholder="Title, publisher, topic or source URL" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>References in a work<select value={work} onChange={event=>setWork(event.target.value)}><option value="">All cited works</option>{works.map(file=><option value={file.id} key={file.id}>{referenceWorkLabel(file)}</option>)}</select></label></div>
    <div className={styles.layout}><nav aria-label="Reference collections" className={styles.collections}>{['All sources',...groups].map(name=><button type="button" key={name} aria-pressed={group===name} onClick={()=>setGroup(name)}><span>{name}</span><small>{name==='All sources'?matches.length:matches.filter(reference=>reference.group===name).length}</small></button>)}</nav>
      <div><div className={styles.results} role="status">{shown.length} {shown.length===1?'reference':'references'}{group==='All sources'?' in the collection':' in '+group}</div>
        <div className={styles.grid}>{shown.map(reference=>{
          const cited=reference.fileIds.flatMap(id=>fileMap.has(id)?[fileMap.get(id)!]:[]);
          return <article key={reference.id} className={styles.card} id={reference.id}>
            <div className={styles.meta}><span>{reference.sourceType}</span><span>{reference.group}</span></div>
            <h3><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></h3>
            <p className={styles.publisher}>{reference.publisher}</p>
            <p className={styles.note}>{reference.note}</p>
            {reference.status!=='Source listed'&&<p className={styles.status}>{reference.status}</p>}
            {cited.length>0&&<div className={styles.cited}><span>Referenced in</span><ul>{cited.slice(0,3).map(file=><li key={file.id}>{referenceWorkLabel(file)}</li>)}</ul>{cited.length>3&&<details><summary>All {cited.length} cited works</summary><ul>{cited.slice(3).map(file=><li key={file.id}>{referenceWorkLabel(file)}</li>)}</ul></details>}</div>}
            <div className={styles.cardFooter}><span>{new URL(reference.url).hostname.replace(/^www\./,'')}</span><a href={reference.url} target="_blank" rel="noopener noreferrer">Open source</a></div>
          </article>;
        })}</div>
        {!shown.length&&<div className={styles.empty}><h3>No matching references</h3><p>Try another topic or clear the filters.</p><button className="button button-green" onClick={()=>{setQuery('');setWork('');setGroup('All sources');}}>Clear filters</button></div>}
      </div>
    </div>
  </div>;
}
