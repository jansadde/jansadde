import type { Metadata } from 'next';
import './globals.css';
import { PageTransition } from '@/components/site/page-transition';
import { Diamond } from '@/components/site/diamond';
export const metadata: Metadata = {
 metadataBase:new URL('https://personal-atelier-portfolio.noblebat16384.chatgpt.site'),
 title:{default:'Sarsekbaeva Almagul — AIB 2604',template:'%s — Sarsekbaeva Almagul'},
 description:'Sarsekbaeva Almagul · AIB 2604. Personal website and company studies.',
 openGraph:{type:'website',locale:'en_GB',siteName:'Sarsekbaeva Almagul',title:'Sarsekbaeva Almagul · AIB 2604',description:'Personal website and company studies.',images:[{url:'/images/architecture.jpg',width:1400,height:2100}]},
 twitter:{card:'summary_large_image'},robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/fonts/fonts.css"/></head><body><PageTransition>{children}</PageTransition><Diamond className="page-corner-diamond"/></body></html>}
