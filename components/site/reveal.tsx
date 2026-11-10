'use client';
import { useEffect } from 'react';
export function Reveals(){useEffect(()=>{const nodes=document.querySelectorAll('[data-reveal]');if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}})},{threshold:.08});nodes.forEach(n=>{n.classList.add('reveal-ready');observer.observe(n)});return()=>observer.disconnect()},[]);return null}
