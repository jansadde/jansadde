'use client';

import { useEffect, useRef, useState } from 'react';
import { Diamond } from './diamond';

export function AboutCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cycle, setCycle] = useState(0);
  const touchStart = useRef<number | null>(null);
  const slots = Array.from({ length: 6 }, (_, i) => photos[i] || '');
  const autoplay = !paused && !hovered && !focused && !reducedMotion && visible;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion(); updateVisibility();
    preference.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { preference.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slots.length), 3000);
    return () => window.clearInterval(timer);
  }, [autoplay, slots.length, cycle]);
  function select(next: number) { setIndex((next + slots.length) % slots.length); setCycle(current => current + 1); }
  function move(step: number) { select(index + step); }
  return <section id="about-photos" className="about-carousel" aria-label="Personal photographs" aria-roledescription="carousel" tabIndex={0}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}
    onPointerDown={event => { touchStart.current = event.pointerType === 'touch' ? event.clientX : null; }}
    onPointerUp={event => { if (touchStart.current !== null && Math.abs(event.clientX - touchStart.current) > 45) move(event.clientX < touchStart.current ? 1 : -1); touchStart.current = null; }}
    onPointerCancel={() => { touchStart.current = null; }}>
    <div className="about-carousel-frame" aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true">
      <div className="about-carousel-slide" key={index} role="group" aria-roledescription="slide" aria-label={`Photograph ${index + 1} of ${slots.length}`}>
        {slots[index] ? <img src={slots[index]} alt={`${name} — personal photograph ${index + 1}`} width={800} height={1000} decoding="async" /> : <div className="about-photo-placeholder"><Diamond /><span className="eyebrow">PHOTOGRAPH {String(index + 1).padStart(2, '0')}</span><p>To be added</p></div>}
      </div>
      <Diamond className="about-photo-diamond" />
    </div>
    <div className="about-carousel-controls"><button type="button" onClick={() => move(-1)} aria-label="Previous photograph">Previous</button><div className="about-carousel-positions" aria-label="Choose a photograph">{slots.map((_, i) => <button key={i} type="button" onClick={() => select(i)} aria-label={`Show photograph ${i + 1}`} aria-current={index === i ? 'true' : undefined}>{String(i + 1).padStart(2, '0')}</button>)}</div><button type="button" onClick={() => move(1)} aria-label="Next photograph">Next</button></div>
    {!reducedMotion && <div className="about-carousel-playback"><button type="button" onClick={() => setPaused(current => !current)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>{paused ? 'Play slideshow' : 'Pause slideshow'}</button></div>}
  </section>;
}
