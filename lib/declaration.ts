import content from './declaration-content.json';
import type { Entry } from './types';
export const defaultDeclarationEntry: Entry = {
  id:'ai-declaration',kind:'declaration',title:'AI Declaration',subtitle:'AI use and verification record',
  description:'A transparent record of AI tools, analysis, verification and human judgment.',
  period:'',category:'',role:'',result:'',image:'',isPublic:true,isExample:false,position:0,
  primaryFileId:'',previewFileId:'',sections:[],declaration:content,
};
