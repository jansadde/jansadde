'use client';

import { useEffect, useRef, useState } from 'react';

type Viewport = { width: number; height: number };
type RenderTask = { promise: Promise<void>; cancel: () => void };
type PdfPage = {
  getViewport: (options: { scale: number }) => Viewport;
  render: (options: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: Viewport; transform?: number[] }) => RenderTask;
};
type PdfDocument = { numPages: number; getPage: (page: number) => Promise<PdfPage> };
type PdfLoadingTask = { promise: Promise<PdfDocument>; destroy: () => Promise<void> };
type PdfModule = { GlobalWorkerOptions: { workerSrc: string }; getDocument: (options: Record<string, unknown>) => PdfLoadingTask };

export function PdfPreview({ src, name, pageLabel='Page', showPageJump=false }: { src: string; name: string; pageLabel?:string; showPageJump?:boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(640);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let task: PdfLoadingTask | undefined;
    setPdf(null); setPage(1); setLoading(true); setError('');
    async function load() {
      try {
        const documentUrl = new URL(src, window.location.href);
        if (documentUrl.origin !== window.location.origin) throw new Error('Unsupported document origin.');
        const library = await import('../../vendor/pdfjs/pdf.min.mjs') as unknown as PdfModule;
        if (disposed) return;
        library.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
        task = library.getDocument({
          url: documentUrl.href, withCredentials: true,
          cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true,
          standardFontDataUrl: '/vendor/pdfjs/standard_fonts/', wasmUrl: '/vendor/pdfjs/wasm/',
          isEvalSupported: false, enableXfa: false,
        });
        const document = await task.promise;
        if (!disposed) { setPdf(document); setLoading(false); }
      } catch (problem) {
        if (disposed) return;
        setError(problem instanceof Error && problem.name === 'PasswordException'
          ? 'This PDF is password-protected. Download it to open it on your device.'
          : 'This PDF could not be previewed. Download it to open it on your device.');
        setLoading(false);
      }
    }
    void load();
    return () => { disposed = true; if (task) void task.destroy().catch(() => {}); };
  }, [src]);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    function resize() { if (node) setWidth(Math.min(1000, Math.max(160, node.clientWidth - 40))); }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let disposed = false;
    let task: RenderTask | undefined;
    setRendering(true);
    async function render() {
      try {
        const pdfPage = await pdf!.getPage(page);
        if (disposed || !canvas.current) return;
        const natural = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: width / natural.width });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(12_000_000 / (viewport.width * viewport.height)));
        const node = canvas.current;
        const context = node.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');
        node.width = Math.floor(viewport.width * outputScale);
        node.height = Math.floor(viewport.height * outputScale);
        node.style.width = `${Math.floor(viewport.width)}px`;
        node.style.height = `${Math.floor(viewport.height)}px`;
        task = pdfPage.render({ canvas: node, canvasContext: context, viewport, transform: [outputScale, 0, 0, outputScale, 0, 0] });
        await task.promise;
        if (!disposed) setRendering(false);
      } catch {
        if (!disposed) { setRendering(false); setError('This page could not be displayed. Download the PDF to view it on your device.'); }
      }
    }
    void render();
    return () => { disposed = true; task?.cancel(); };
  }, [pdf, page, width]);

  return <div className="pdf-preview">
    {pdf && <div className="pdf-preview-toolbar"><button type="button" disabled={page <= 1 || rendering} onClick={() => setPage(current => current - 1)}>Previous</button><span aria-live="polite">{pageLabel} {page} of {pdf.numPages}</span>{showPageJump&&<label className="pdf-page-jump">Go to {pageLabel.toLowerCase()}<select aria-label={'Go to '+pageLabel.toLowerCase()} value={page} disabled={rendering} onChange={event=>setPage(Number(event.target.value))}>{Array.from({length:pdf.numPages},(_,index)=><option key={index+1} value={index+1}>{index+1}</option>)}</select></label>}<button type="button" disabled={page >= pdf.numPages || rendering} onClick={() => setPage(current => current + 1)}>Next</button></div>}
    {loading && <p className="pdf-preview-status" role="status">Loading PDF…</p>}
    {error && <p className="pdf-preview-error" role="alert">{error}</p>}
    <div className="pdf-preview-pages" ref={container} aria-busy={loading || rendering}>{pdf && !error && <canvas ref={canvas} className="pdf-preview-canvas" role="img" aria-label={`${name}, ${pageLabel.toLowerCase()} ${page} of ${pdf.numPages}`} />}</div>
  </div>;
}
