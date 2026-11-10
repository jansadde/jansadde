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

Education, Achievements, and the former Photographs section are removed from active pages, menus, footer, and dashboard. Their old stored records are preserved without reappearing in the interface. Old biography/contact, assignment, archive, governance, and weekly-record URLs redirect to the current relevant pages.

Home displays **Sarsekbaeva Almagul**, **AIB 2604**, and the owner-supplied portrait, the larger E PORTFOLIO label, and no Get in touch link. The footer retains the first version’s subsection directory without the large conversation heading, and contains separate clickable links for `almasarsekbaeva@yandex.com` and `260184@astanait.edu.kz`.

About Me is managed in **Owner dashboard / About Me**. It contains the owner’s supplied jewelry story and six photographs, all editable through the dashboard. The carousel advances every three seconds, with Pause/Play, Previous/Next, direct position buttons, keyboard navigation, and touch swipes. It pauses during hover, focus, or a hidden tab and respects reduced motion. The public About Me page has no Edit link. Upload images in All Documents, publish them, then select them for each slot. Artifacts and Evidence Folder keep file search, preview, and downloads without category tabs. Weekly Reports starts with four records. Older weekly slots 5–9 and their files stay stored without appearing in the active list.

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

## Local launch in VS Code

Use Node.js **22.13 or later**. In the project directory, for a fresh source download:

```sh
npm run install:ci
npm run build
```

Apply this migration **once to a new local database only**:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_heavy_cobalt_man.sql
```

Start development:

```sh
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/`; the dashboard is `http://127.0.0.1:5173/admin`. Subsequent launches need only the development command. Local sign-in uses the starter's loopback-only development account and is not included in production.

The original Vinext/React/TypeScript, D1, R2, and Sites authentication architecture is preserved. Existing local and hosted databases are separate. No new SQL migration is required for this update; versioned initialization extends the existing JSON records without deleting owner data.

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

## Hosting state

The existing Site ID, audience, storage bindings, and owner secret are preserved. Publication requires access to the existing source repository. The current environment could not resolve that repository host, so this update is available locally and in the source archive; it has not replaced the earlier hosted version. Do not infer publication from a successful local build.

## All Project showcase

All Project now displays only the supplied SPROUT poster and a Visit website button linking to https://sprout-neon-five.vercel.app. It replaces the former project cards and introductory copy. An emerald editorial header, champagne framing, and a bold gold Visit website button match the portfolio style; the layout adapts to mobile widths. The poster and URL use the existing SPROUT project record (Owner dashboard / All Project), so they remain editable. Older stored project content and attachments are retained.
# jansadde
