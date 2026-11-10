import type { Entry, Profile, Category } from './types';

export const contentRevision = '2026-11-07-home-portrait-v3';
export const aboutContentRevision = '2026-11-07-about-six-photos-v1';
export const aboutPhotoFields = ['aboutPhoto1', 'aboutPhoto2', 'aboutPhoto3', 'aboutPhoto4', 'aboutPhoto5', 'aboutPhoto6'] as const;
export const defaultProfile: Profile = {
  name: 'Sarsekbaeva Almagul',
  latinName: 'Sarsekbaeva Almagul',
  initials: 'SA',
  academicGroup: 'AIB 2604',
  contentRevision,
  tagline: '',
  intro: '',
  biography: 'Editable placeholder. Add your own introduction, experiences, and perspective here.',
  story: 'Editable placeholder. Share your personal story and the experiences that shaped it.',
  values: 'Editable placeholder. Describe the principles that guide your own choices.',
  interests: 'Editable placeholder. Introduce your own interests and activities.',
  goals: 'Editable placeholder. Add your own goals and plans.',
  location: '',
  email: 'almasarsekbaeva@yandex.com',
  secondaryEmail: '260184@astanait.edu.kz',
  linkedin: '',
  instagram: '',
  heroPhoto: '/images/almagul-home-portrait.jpg',
  biographyPhoto: '',
  aboutText: `Ever since I was a little girl, I have had a special connection with jewelry and accessories. I remember how even the smallest pieces could make me feel happier, more confident, and more like myself. For me, jewelry has never been just about looking pretty. It has always been a way to express my mood, feelings, and personality without saying a word.

I believe that jewelry is like the cherry on top of a cake. Even the smallest accessory can completely transform an outfit, make it more interesting, and add a unique touch to someone’s style.

Sometimes, all it takes is a beautiful pair of earrings, a necklace, or a ring to feel 100% more confident and special.

What I love most about accessories is that everyone can express themselves differently through them. That is what makes jewelry so interesting to me.

I believe that jewelry is not just about beauty or fashion. It is about individuality, creativity, and the way we want to present ourselves to the world.`,
  aboutPhoto1: '/images/about/photo-01.jpg',
  aboutPhoto2: '/images/about/photo-02.jpg',
  aboutPhoto3: '/images/about/photo-03.jpg',
  aboutPhoto4: '/images/about/photo-04.jpg',
  aboutPhoto5: '/images/about/photo-05.jpg',
  aboutPhoto6: '/images/about/photo-06.jpg',
  aboutContentRevision,
  contactNote: 'Use the email addresses below to get in touch.',
};

const base={subtitle:'',description:'',period:'Add a date',category:'',role:'',result:'',image:'',isPublic:true,isExample:true,position:0};
function sample(id:string,kind:Entry['kind'],title:string,extra:Partial<Entry>={}):Entry{return {...base,id,kind,title,...extra}}
export const defaultSproutProject: Entry = {
  id: 'example-project-1', kind: 'project', title: 'SPROUT', subtitle: 'Personal Habit Tracking System', description: '',
  period: '', category: '', role: '', result: '', image: '/images/projects/sprout-poster.png',
  isPublic: true, isExample: false, position: 0, sections: [],
  link: 'https://sprout-neon-five.vercel.app', code: '',
};
const originalExampleEntries: Entry[] = [
 defaultSproutProject,
 sample('example-project-2','project','A different perspective',{subtitle:'Your second project',category:'Independent work',description:'Add a creative, technical, educational, or social initiative. Explain what motivated it and how it developed.',role:'Add your role',result:'Share the outcome of the project.',image:'/images/mountains.jpg',position:1,link:'',code:'',sections:[{heading:'Implementation notes',body:'Document your process, key design choices, and practical lessons.'}]}),
 sample('observations','fieldwork','Field observations & analysis',{subtitle:'Learning beyond the page',description:'Add an event, visit, interview, or field experience of your own. Record the context and distinguish what you observed from your interpretation.',category:'Observations',sections:[{heading:'Observation notes',body:'Write your own notes, including the setting, purpose, and key observations.'},{heading:'Analysis & reflection',body:'Connect the experience to your learning and explain its significance.'}]}),
 sample('survey','fieldwork','Survey findings',{subtitle:'From responses to understanding',description:'Describe your own survey or interview activity. Explain the method, consent, and limitations before presenting the findings.',category:'Survey',position:1,table:{columns:['Question or theme','Your finding','Evidence / limitation'],rows:[['Add a theme','Add your finding','Add context']]} }),
];


export const academicContentRevision = '2026-11-07-academic-documents-v1';
export const protectedCategoryIds = ['artifacts', 'evidence'] as const;
export const defaultProtectedCategories: Category[] = [
  { id: 'artifacts', name: 'Artifacts', isProtected: true },
  { id: 'evidence', name: 'Evidence Folder', isProtected: true },
];
export const defaultWeeklyEntries: Entry[] = Array.from({ length: 4 }, (_, index) => ({
  id: `week-${index + 1}`, kind: 'weekly', title: `Weekly Report ${index + 1}`,
  subtitle: '', description: '', period: '', category: '', role: '', result: '', image: '',
  isPublic: true, isExample: false, position: index + 1, sections: [], link: '', code: '',
}));
export const defaultLegacyEntries: Entry[] = [
  ...originalExampleEntries.filter(entry => ['project', 'fieldwork'].includes(entry.kind)),
  ...defaultWeeklyEntries,
];
export const defaultCapstoneEntry: Entry = {
  id: 'capstone-main', kind: 'capstone', title: 'Capstone Project', subtitle: '', description: '',
  period: '', category: '', role: '', result: '', image: '', isPublic: true, isExample: false,
  position: 0, sections: [], link: '', code: '',
};
export { companyResearchEntries as defaultCompanyEntries } from './company-research';
import { companyResearchEntries } from './company-research';
export const defaultEntries: Entry[] = [...defaultLegacyEntries, ...companyResearchEntries, defaultCapstoneEntry];
export const defaultCategories: Category[] = [
  ...defaultProtectedCategories,
  { id: 'company-materials', name: 'Company materials' },
  { id: 'project-materials', name: 'Project materials' },
  { id: 'personal-documents', name: 'Personal documents' },
  { id: 'other', name: 'Other' },
];
