export type Profile = {
  name: string; latinName: string; initials: string; tagline: string; intro: string;
  academicGroup: string; secondaryEmail: string; contentRevision: string;
  biography: string; story: string; values: string; interests: string; goals: string;
  location: string; email: string; linkedin: string; instagram: string;
  heroPhoto: string; biographyPhoto: string; contactNote: string;
  aboutText: string; aboutPhoto1: string; aboutPhoto2: string; aboutPhoto3: string;
  aboutPhoto4: string; aboutPhoto5: string; aboutPhoto6: string; aboutContentRevision: string;
};
export type DeclarationContent = {
  preparedOn: string; status: string; scope: string;
  details: {label:string;value:string}[];
  blocks: {id:string;title:string;intro:string;columns:string[];rows:string[][];paragraphs:string[]}[];
};
export type EntryKind = 'declaration' | 'attestation' | 'company' | 'capstone' | 'education' | 'achievement' | 'project' | 'deliverable' | 'weekly' | 'fieldwork' | 'governance';
export type Entry = {
  id: string; kind: EntryKind; title: string; subtitle: string; description: string;
  period: string; category: string; role: string; result: string; image: string;
  isPublic: boolean; isExample: boolean; position: number;
  sections?: {heading: string; body: string}[]; table?: {columns: string[]; rows: string[][]};
  link?: string; code?: string;
  facts?: {label:string;value:string}[];
  timeline?: {year:string;title:string;body:string}[];
  sources?: {title:string;url:string}[];
  gallery?: {src:string;alt:string;caption:string;sourceUrl:string}[];
  primaryFileId?: string; supportingFileId?: string; previewFileId?: string; supportingPreviewFileId?: string;
  declaration?: DeclarationContent;
  researchRevision?: string;
};
export type ArchiveFile = {
  id: string; name: string; description: string; categoryId: string | null; size: number;
  mime: string; storageKey?: string; isPublic: boolean; isPhoto: boolean;
  projectId: string | null; addedAt: string; deletedAt: string | null;
};
export type Category = { id: string; name: string; isProtected?: boolean };
export type Message = { id: string; name: string; email: string; message: string; createdAt: string; isRead: boolean };
export type SourceReference = {
  id: string; title: string; publisher: string; url: string; group: string;
  sourceType: string; note: string; status: string; fileIds: string[];
  isPublic: boolean; position: number;
};
export type Portfolio = { profile: Profile; entries: Entry[]; documents: ArchiveFile[]; categories: Category[]; photos: ArchiveFile[]; references: SourceReference[] };
export type AdminData = Portfolio & { messages: Message[]; trash: ArchiveFile[] };
