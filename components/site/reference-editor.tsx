'use client';
import { useState } from 'react';
import type { ArchiveFile, SourceReference } from '@/lib/types';
import { referenceGroups, referenceTypes, referenceStatuses, referenceWorkLabel } from '@/lib/references';

export function ReferenceEditor({references,files,busy,onSave}:{references:SourceReference[];files:ArchiveFile[];busy:boolean;onSave:(references:SourceReference[])=>Promise<boolean>}) {
  const [query,setQuery]=useState('');const [editing,setEditing]=useState<SourceReference|null>(null);
  const [removing,setRemoving]=useState('');
  const ordered=[...references].sort((a,b)=>a.position-b.position);
  const filtered=ordered.filter(reference=>(reference.title+' '+reference.publisher+' '+reference.url).toLowerCase().includes(query.toLowerCase()));
  async function save(reference:SourceReference) {
    const next=references.some(current=>current.id===reference.id)?ordered.map(current=>current.id===reference.id?reference:current):[...ordered,reference];
    if(await onSave(next))setEditing(null);
  }
  return <>
    <section className="admin-card"><h2>Sources & references</h2><p className="editor-intro">Evidence Folder contains references only. Edit source titles, links, citation notes and the works that cite them. Uploaded assignments remain in All Documents and their original sections.</p><div className="form-grid"><label>Find a reference<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Title, publisher or URL" /></label><div className="editor-save"><button type="button" className="button button-green" onClick={()=>setEditing({id:crypto.randomUUID(),title:'',publisher:'',url:'',group:referenceGroups[0],sourceType:referenceTypes[0],status:referenceStatuses[0],note:'',fileIds:[],isPublic:false,position:ordered.length+1})}>Add reference</button></div></div></section>
    {editing&&<form className="admin-card" onSubmit={event=>{event.preventDefault();save(editing);}}>
      <div className="panel-title"><h2>Edit reference</h2><button type="button" className="text-link" onClick={()=>setEditing(null)}>Cancel</button></div>
      <label>Reference title<input required maxLength={300} value={editing.title} onChange={event=>setEditing({...editing,title:event.target.value})}/></label>
      <div className="form-grid"><label>Publisher or author<input maxLength={200} value={editing.publisher} onChange={event=>setEditing({...editing,publisher:event.target.value})}/></label><label>Source URL<input required type="url" pattern="https://.*" maxLength={500} value={editing.url} onChange={event=>setEditing({...editing,url:event.target.value})}/></label></div>
      <div className="form-grid"><label>Collection<select value={editing.group} onChange={event=>setEditing({...editing,group:event.target.value})}>{referenceGroups.map(group=><option key={group}>{group}</option>)}</select></label><label>Source type<select value={editing.sourceType} onChange={event=>setEditing({...editing,sourceType:event.target.value})}>{referenceTypes.map(type=><option key={type}>{type}</option>)}</select></label><label>Citation status<select value={editing.status} onChange={event=>setEditing({...editing,status:event.target.value})}>{referenceStatuses.map(status=><option key={status}>{status}</option>)}</select></label></div>
      <label>Scope and citation note<textarea rows={4} maxLength={2000} value={editing.note} onChange={event=>setEditing({...editing,note:event.target.value})}/></label>
      <fieldset className="reference-work-picker"><legend>Works that cite this source</legend><p className="form-hint">Select only works that actually reference this resource. Private or deleted works are not shown on the public page.</p>{files.map(file=><label key={file.id} className="checkbox-label"><input type="checkbox" checked={editing.fileIds.includes(file.id)} onChange={event=>setEditing({...editing,fileIds:event.target.checked?[...editing.fileIds,file.id]:editing.fileIds.filter(id=>id!==file.id)})}/><span>{referenceWorkLabel(file)}{file.deletedAt?' (in trash)':!file.isPublic?' (private)':''}</span></label>)}</fieldset>
      <label className="checkbox-label"><input type="checkbox" checked={editing.isPublic} onChange={event=>setEditing({...editing,isPublic:event.target.checked})}/><span>Publish reference in Evidence Folder</span></label>
      <button disabled={busy} className="button button-green" type="submit">{busy?'Saving…':'Save reference'}</button>
    </form>}
    <section className="admin-card entry-list" aria-label="Reference records">{filtered.map(reference=><article key={reference.id}><div className="entry-list-copy"><span className={'visibility-badge '+(reference.isPublic?'public':'')}>{reference.isPublic?'Public':'Private'}</span><h3>{reference.title}</h3><p className="form-hint">{reference.publisher} · {reference.group}</p></div><div className="entry-list-actions"><button className="text-link" onClick={()=>{setEditing({...reference,fileIds:[...reference.fileIds]});setRemoving('');}}>Edit</button><button className="text-link danger" onClick={()=>setRemoving(reference.id)}>Remove</button></div>{removing===reference.id&&<div className="delete-confirm"><span>Remove this reference? Its original documents will remain.</span><button disabled={busy} onClick={async()=>{if(await onSave(ordered.filter(item=>item.id!==reference.id))){setRemoving('');if(editing?.id===reference.id)setEditing(null);}}}>Remove reference</button><button onClick={()=>setRemoving('')}>Cancel</button></div>}</article>)}{!filtered.length&&<p>No matching references.</p>}</section>
  </>;
}
