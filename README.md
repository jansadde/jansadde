# Sarsekbaeva Almagul — Personal Atelier

The existing project has been updated in place. The deep emerald, ivory, and champagne-gold identity, owner photograph, academic group, and two footer email links are retained. Website and dashboard copy are in English.

## Public website

The main navigation is:

1. Home.
2. About Me: six owner-supplied photographs and owner-written text.
3. Companies: Tiffany & Co. and KazakhYuvelir.
4. Tech Code: All Project only.
5. Artifacts.
6. Evidence Folder.
7. Capstone Project.
8. Weekly Reports.
9. Attestations.
10. AI Declaration.

Education, Achievements, and the former Photographs section are removed from active pages, menus, footer, and dashboard. Their old stored records are preserved without reappearing in the interface. Old biography/contact, assignment, archive, governance, and weekly-record URLs redirect to the current relevant pages.

Home displays **Sarsekbaeva Almagul**, **AIB 2604**, and the owner-supplied portrait, the larger E PORTFOLIO label, and no Get in touch link. The footer retains the first version’s subsection directory without the large conversation heading, and contains separate clickable links for `almasarsekbaeva@yandex.com` and `260184@astanait.edu.kz`.

About Me is managed in **Owner dashboard / About Me**. It contains the owner’s supplied jewelry story and six photographs, all editable through the dashboard. The carousel advances every three seconds, with Pause/Play, Previous/Next, direct position buttons, keyboard navigation, and touch swipes. It pauses during hover, focus, or a hidden tab and respects reduced motion. The public About Me page has no Edit link. Upload images in All Documents, publish them, then select them for each slot. Artifacts and Evidence Folder keep file search, preview, and downloads without category tabs. Weekly Reports contains all nine weekly slots, also linked from the footer.

Times New Roman is used across the website and dashboard, with slightly heavier text. It uses the device’s installed font, with Times and the system serif as fallbacks.

## Company profiles

Both profiles contain an introduction, founding information, leadership, history, development timeline, characteristics, collections, official-source photographs, and source links. The company model also supports owner-edited chapters, tables, galleries, and attachments.

KazakhYuvelir's 1941 institutional origin is distinguished from the current legal entity's 1993 registration. Its registry-based executive attribution is dated and qualified. No individual historical founder or undocumented beneficial owner is invented. Exact verification and image sources are in `COMPANY_RESEARCH.md`.

The Tiffany cover now uses the official craftsmanship photograph. The previous supplied diamond cover is replaced while owner-uploaded covers remain unchanged. Only exact, unedited older company placeholders are upgraded to researched content. Real owner edits, images, public/private choices, and subsequent saved research edits are retained.

## Uploading existing reports

Open `/admin` with the owner account and choose **Weekly Reports**.

1. Find the weekly record.
2. Drag a PDF, DOC, or DOCX into its upload area, or choose a file.
3. Leave **Make public on the website** unchecked to keep it private, or explicitly check it to publish it.
4. Choose **Upload file**.

The filename, trusted file type, upload date, visibility, preview, download, edit, replace, and delete controls then appear. **Add weekly record** creates another title and upload slot. Reports contain no generated narratives or preloaded documents. The owner-only upload links on the public weekly page open the actual dashboard at the selected record.

## Other documents

The same `DocumentManager` component is used for Artifacts, Evidence Folder, Capstone, weekly reports, company materials, projects, field work, and the unified All Documents view. It supports multiple files and drag/drop. Accepted formats are PDF, DOC, DOCX, PPTX, XLSX, PNG, JPG, JPEG, WEBP, and GIF; the maximum is 20 MB per file. Weekly records are restricted to PDF/DOC/DOCX on the server as well as in the interface.

- Artifacts is an independent archive, including published materials from the former field gallery and assignment categories.
- Evidence Folder is the complete published supporting-file archive. Its upload area uses a dedicated Evidence Folder category.
- Capstone Project has an editable title, description, content sections, and mixed attachments.
- All Documents retains access to active files, archived record associations, image selection for Home, and recoverable trash.

PDFs render locally through a lazy-loaded, vendored Mozilla PDF.js viewer with page navigation. Images have inline previews. Word, PowerPoint, and Excel files provide a download fallback for viewing in an office application. Private file URLs are never sent to third-party viewers.

Deleting a file moves it to recoverable trash. Replacement retains its record/category context. A new upload is private unless explicitly marked public. The file API enforces access on every preview and download; private and trashed files are excluded from public metadata. Filename/type validation, Office package validation, macro rejection, request-size limits, owner authentication, and same-origin mutation checks remain in place.

## Design and typography

Small diamonds appear on every page and major record/profile block. Each instance receives a separate randomized animation period and phase. Glints are restrained; floating is limited to selected photo decorations. `prefers-reduced-motion` disables both effects.

The font stacks use Times New Roman throughout the interface, following the owner’s latest request. No proprietary font binaries are distributed. Earlier open-font assets remain in the source for compatibility. See `ASSETS.md`.

## Local launch and Vercel

Use Node.js 24. Install with `npm ci`, copy `.env.example` to `.env.local`, and set the Supabase URL, publishable key, server-only secret key and owner email. Never commit `.env.local`.

Run `npm run dev` and open http://localhost:5173. Build with `npm run build`; production uses `npm start`.

Vercel uses the repository root, the Next.js preset, `npm ci`, `npm run build`, and the default output directory. Add the same environment variables in Vercel, excluding the localhost site URL. Optionally set `NEXT_PUBLIC_SITE_URL` to the production origin.

Supabase stores the existing content in PostgreSQL and files in the private `portfolio-vault` bucket. Apply `supabase/schema.sql` to a new project, then `supabase/rpc.sql`. The latter registers only the application's fixed, parameterized statements; public and authenticated clients cannot execute these functions. If prepared SQL changes, run `node scripts/prepare-supabase-rpc.mjs` and apply the regenerated migration. The server uses the secret key; no database password is needed.

The owner signs in at `/sign-in` using a confirmed Supabase Auth account matching `ADMIN_EMAIL`. Client-supplied identity headers grant no access. Uploads go directly to private storage through short-lived signed upload tokens, followed by server validation; this supports the existing 20 MB limit on Vercel.

Historical Cloudflare configuration is retained for reference. The `cloudflare-before-vercel` branch preserves the previous implementation. Runtime commands now use native Next.js.

## Verification

```sh
npx tsc --noEmit
npm run build
node tests/companies-model.mjs
node tests/document-api.mjs
node tests/document-ui.mjs
node tests/site-render.mjs
```

The suites contain 75 model checks, 48 actual API-handler scenarios, 25 document UI checks, and 36 public-site rendering checks: **184 checks** in total. They use isolated fixtures, in-memory SQLite/D1, and in-memory R2; they do not read the owner's stored files or messages.

Browser QA also checked all ten public routes at mobile width, mobile/desktop layouts, varied diamond timings, the real weekly upload interface, private PDF upload/download, single- and multi-page PDF rendering and pagination, and deletion into trash. The two temporary browser-test PDFs were private and were moved to local trash after testing; no demo documents are published.

The earlier `tests/integration.mjs` and `tests/upload-formats.mjs` are historical scripts using retired academic fixtures. Use the current suites above instead.

## All Project showcase

All Project now displays only the supplied SPROUT poster and a Visit website button linking to https://sprout-neon-five.vercel.app. It replaces the former project cards and introductory copy. An emerald editorial header, champagne framing, and a bold gold Visit website button match the portfolio style; the layout adapts to mobile widths. The poster and URL use the existing SPROUT project record (Owner dashboard / All Project), so they remain editable. Older stored project content and attachments are retained.
# jansadde
