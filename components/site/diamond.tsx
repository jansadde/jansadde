'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export function Diamond({ className = '' }: { className?: string }) {
  const [timing, setTiming] = useState({ duration: 23, delay: -5, floatDelay: -2 });
  useEffect(() => {
    const duration = 17 + Math.random() * 19;
    setTiming({ duration, delay: -Math.random() * duration, floatDelay: -Math.random() * 9 });
  }, []);
  const style = {
    '--diamond-duration': `${timing.duration.toFixed(2)}s`,
    '--diamond-delay': `${timing.delay.toFixed(2)}s`,
    '--diamond-float-delay': `${timing.floatDelay.toFixed(2)}s`,
  } as CSSProperties;
  return <svg className={`diamond-symbol ${className}`} style={style} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><path d="M12 8h24l9 11L24 42 3 19 12 8Z M3 19h42 M12 8l5 11 7-11 7 11 5-11 M17 19l7 23 7-23" stroke="currentColor" strokeWidth=".8" strokeLinejoin="round" /></svg>;
}
