# Licensed site assets

Downloaded and sources checked on 2026-11-07.

## Typography

`fonts/fonts.css` contains ready-to-use local `@font-face` rules, with Latin, Latin extended, Cyrillic, and Cyrillic extended subsets. All URLs are relative to that CSS file.

- Cormorant Garamond: normal 400 and 500, italic 400. Source: https://fonts.google.com/specimen/Cormorant+Garamond . License: SIL Open Font License 1.1, retained as `fonts/OFL-CormorantGaramond.txt`.
- Manrope: normal 400, 500, 600. Source: https://fonts.google.com/specimen/Manrope . License: SIL Open Font License 1.1, retained as `fonts/OFL-Manrope.txt`.
- Both fonts permit local web embedding, redistribution with license, and commercial use under OFL. Keep the license files with the fonts. Do not sell the fonts by themselves. Modified fonts must respect any Reserved Font Names in the corresponding license.
- `fonts/google-fonts.css` retains the original Google Fonts CSS response, including original source URLs.

### Housing Demo finding

The user-supplied page https://fonts-online.ru/fonts/housing-demo identifies Asep Rendi and Copyright by Arendxstudio. Its visible license grants personal use only. This does not establish permission for production webfont embedding. The full downloaded page is preserved at `../../housing-page.html` for evidence.

The author's own product listing offers a separate Webfont license: https://creativemarket.com/Arendstudio/278374547-Housing-Classy-Script-Font . MyFonts also identifies Asep Rendi / Arendxstudio and offers a Webfont license for @font-face embedding on one domain: https://www.myfonts.com/collections/housing-font-arendxstudio/ . No Housing Demo binary was downloaded or bundled. The previous version used the open Cormorant Garamond alternative until the owner requested Times New Roman; Cormorant is an editorial stylistic alternative, not an exact substitute for the script's glyphs.

## Photography

All three are free images under the standard Unsplash License: https://unsplash.com/license . This permits free commercial and noncommercial download, copying, modification, distribution, and use. Attribution is appreciated but not required. The license prohibits selling unmodified images and compiling images into a competing service. Other rights (for example, rights of publicity, trademarks, property, and artwork) are not automatically granted by the copyright license. These images are used only as demonstration editorial assets.

| Local file | Author | Source | Image notes |
| --- | --- | --- | --- |
| `photos/architecture-hong-kong.jpg` | I P (@ipraudz) | https://unsplash.com/photos/modern-concrete-architecture-with-geometric-patterns-and-stairs-dzql1-bpIso | M+ in Hong Kong; warm concrete, shadow and architectural geometry, 2000 × 3000 |
| `photos/mountains-almaty.jpg` | Muhammet Cengiz (@herasun) | https://unsplash.com/photos/green-mountain-slope-under-a-blue-sky-with-clouds-lh0PZX2W4tE | Almaty mountains; green slopes and blue sky, 2000 × 1333 |
| `photos/portrait-demo.jpg` | Mishaal Zahed | https://unsplash.com/photos/a-man-is-posing-for-a-picture-in-black-and-white-FUYHvOrhanI | Black-and-white editorial portrait, 1600 × 2483. Clearly label as a demonstration portrait; do not identify this person as the site owner. |

Suggested visible credit: “Illustrative photography: Mishaal Zahed, I P, Muhammet Cengiz / Unsplash.” Link photographers or photo pages where practical.

## Owner-supplied homepage photograph

`public/images/almagul-home.jpg` is the photograph supplied by the user on 2026-11-07 for the homepage. It replaces the previous sample portrait/architectural homepage image. The source was resized to 1600 × 2133 and encoded as a web JPEG; the original file was not changed. No claim of an Unsplash license applies to this owner-supplied photograph.

## Company study visuals

`public/images/tiffany-study.svg` and `public/images/kazakhyuvelir-study.svg` are original abstract jewelry illustrations authored for this project. They are not official company photography, logos, or representations of specific products. The public page labels them illustrative, and the dashboard can replace them with verified imagery.

### Local PDF rendering

Mozilla PDF.js (`pdfjs-dist` 5.6.205), Apache-2.0, is vendored from the preinstalled workspace runtime. The lazily imported browser library is in `vendor/pdfjs`; its worker, CMaps, standard fonts, and WASM assets are in `public/vendor/pdfjs`. License notices are retained. This avoids a third-party document viewer and keeps both public and private PDF requests on the website's authenticated file API. Upstream: https://mozilla.github.io/pdf.js/ and https://github.com/mozilla/pdf.js.

## Owner-supplied About Me photographs

The six files in `public/images/about/photo-01.jpg` through `photo-06.jpg` are the user-supplied IMG_9401.JPG, IMG_9400.JPG, IMG_9399.JPG, IMG_9397.JPG, IMG_9396.JPG, and IMG_9394.JPG, in that order. They are copied unchanged and displayed without cropping in About Me. These are personal images supplied for this website, not stock imagery.

## Latest owner portrait and Times New Roman typography

`public/images/almagul-home-portrait.jpg` is the user’s IMG_9402.JPG copied unchanged for the updated homepage. The six About Me photographs remain unchanged.

Times New Roman is selected through the system font stack across the site and dashboard, with slightly heavier text. Times and the browser’s serif family are fallbacks on devices without Times New Roman installed. No Times New Roman or Perandory font binaries are bundled.

## SPROUT project poster

`public/images/projects/sprout-poster.png` is the user-supplied image_2026-11-06_01-13-52.png, copied unchanged (1122 × 1402). It is displayed in full on All Project, followed by a link to the user-supplied project URL https://sprout-neon-five.vercel.app. Text inside the supplied artwork is preserved; website labels remain in English.
