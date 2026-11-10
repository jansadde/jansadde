import Link from '@/components/site/link';
export default function SignOut(){return <main id="main" className="admin-login"><h1>Sign out</h1><form method="post" action="/api/auth/logout"><button className="button button-ivory" type="submit">Sign out of your account</button></form><Link href="/admin">Back to dashboard</Link></main>;}
