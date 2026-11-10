export const navigation = [
  { href: '/', label: 'Home', items: [] },
  { href: '/about-me', label: 'About Me', items: [] },
  { href: '/companies', label: 'Companies', items: [{ href: '/companies#company-tiffany', label: 'Tiffany & Co.' }, { href: '/companies#company-kazakhyuvelir', label: 'KazakhYuvelir' }] },
  { href: '/tech-code', label: 'Tech Code', items: [{ href: '/projects', label: 'All Project' }] },
  { href: '/artifacts', label: 'Artifacts', items: [] },
  { href: '/attestations', label: 'Attestations', items: [] },
  { href: '/evidence-folder', label: 'Evidence Folder', items: [] },
  { href: '/capstone-project', label: 'Capstone Project', items: [] },
  { href: '/weekly-reports', label: 'Weekly Reports', items: [] },
  { href: '/ai-declaration', label: 'AI Declaration', items: [] },
];

export const directory = [
  { number: '01', title: 'Companies', eyebrow: 'TWO JEWELRY HOUSES', description: 'Explore the history, leadership, design, and development of Tiffany & Co. and KazakhYuvelir.', href: '/companies' },
  { number: '02', title: 'Tech Code', eyebrow: 'PROJECTS & IMPLEMENTATION', description: 'Browse projects and their supporting materials.', href: '/tech-code' },
  { number: '03', title: 'Artifacts', eyebrow: 'THE WORK ITSELF', description: 'Documents, presentations, images, and selected academic materials.', href: '/artifacts' },
  { number: 'A1–A4', title: 'Attestations', eyebrow: 'FOUR ASSIGNMENTS', description: 'Business Report, Video Essay, Photo Essay and Argumentative Essay, each with supporting materials.', href: '/attestations' },
  { number: '04', title: 'Evidence Folder', eyebrow: 'SOURCES & REFERENCES', description: 'Company publications, research, business literature and the sources behind the work.', href: '/evidence-folder' },
  { number: '05', title: 'Capstone Project', eyebrow: 'THE FINAL PROJECT', description: 'The final academic project and its documents, presentation, and attachments.', href: '/capstone-project' },
  { number: '06', title: 'Weekly Reports', eyebrow: 'WEEK BY WEEK', description: 'A simple collection of uploaded PDF and Word reports.', href: '/weekly-reports' },
  { number: '07', title: 'AI Declaration', eyebrow: 'TOOLS & HUMAN JUDGMENT', description: 'AI systems, preparation activities, evidence checks and the declaration record.', href: '/ai-declaration' },
];

// Footer shortcuts remain independent from the compact menus in the header.
export const footerNavigation = navigation.map(group => ({ ...group, items:
  group.href === '/' ? [{ href: '/about-me', label: 'About me' }, { href: '/#contact', label: 'Contact' }] :
  group.href === '/about-me' ? [{ href: '/about-me#about-photos', label: 'Personal photographs' }, { href: '/about-me#about-story', label: 'Personal story' }] :
  group.href === '/artifacts' ? [{ href: '/artifacts#artifact-files', label: 'Documents & materials' }] :
  group.href === '/attestations' ? [{href:'/attestations#attestation-a1',label:'Business Report'},{href:'/attestations#attestation-a2',label:'Video Essay'},{href:'/attestations#attestation-a3',label:'Photo Essay'},{href:'/attestations#attestation-a4',label:'Argumentative Essay'}] :
  group.href === '/evidence-folder' ? [{ href: '/evidence-folder#sources-references', label: 'Sources & references' }] :
  group.href === '/capstone-project' ? [{ href: '/capstone-project#capstone-overview', label: 'Project overview & files' }] :
  group.href === '/ai-declaration' ? [{href:'/ai-declaration#declaration-a',label:'AI systems register'},{href:'/ai-declaration#declaration-e',label:'Verification & corrections'}] :
  group.href === '/weekly-reports' ? Array.from({ length: 9 }, (_, i) => ({ href: '/weekly-reports#weekly-report-' + (i + 1), label: 'Weekly Report ' + (i + 1) })) : group.items,
}));
