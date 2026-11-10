import type { AnchorHTMLAttributes } from 'react';
// Native links give each route a fresh, server-authorized response. Page-entry
// transitions and in-page tabs remain enhanced independently of navigation.
export default function Link(props:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props}/>}
