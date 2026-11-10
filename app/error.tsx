'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="error-page"><span className="eyebrow">THIS PAGE COULD NOT BE LOADED</span><h1>A brief pause.</h1><p>Please try loading the page again in a moment.</p><button className="button button-ivory" onClick={reset}>Try again</button></main>}
