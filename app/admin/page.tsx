import type { Metadata } from 'next';
import { getChatGPTUser,chatGPTSignInPath } from '@/app/chatgpt-auth';
import { getPortfolio,isAdmin } from '@/lib/server';
import { AdminPanel } from '@/components/site/admin';
import type { AdminData } from '@/lib/types';
import Link from '@/components/site/link';
import { LockKeyhole } from 'lucide-react';
export const dynamic='force-dynamic';export const metadata:Metadata={title:'Owner dashboard',robots:{index:false,follow:false}};
export default async function Admin(){const user=await getChatGPTUser();if(!user||!(await isAdmin()))return <main id="main" className="admin-login"><Link className="login-brand" href="/">PERSONAL ATELIER</Link><LockKeyhole size={32} strokeWidth={1}/><span className="eyebrow">YOUR PERSONAL SPACE</span><h1>Your website,<br/><em>in your hands.</em></h1><p>{user?'This account does not have access to manage the website. Please sign in with the owner account.':'Sign in with the owner account to edit the website and manage your personal archive.'}</p><a className="button button-ivory" target="_top" href={chatGPTSignInPath('/admin')}>Sign in with ChatGPT</a><Link className="login-back" href="/">Back to the website</Link></main>;
 const data=await getPortfolio(true) as AdminData;return <AdminPanel initialData={data} displayName={user.displayName}/>}
