# Self-hosted brand font

The existing Plus Jakarta Sans family is delivered from this app's own origin,
not Google's stylesheet/CDN. The former Google CSS import violated the existing
style-src/font-src policy; it was a font delivery error, not evidence of a failed
PETA result API. The CSP remains unchanged. Weight range 200–800, normal style,
font-display swap. No font redesign or new tracking service is introduced.

- Asset: `public/fonts/plus-jakarta-sans/PlusJakartaSans-Variable.ttf` (176288 bytes).
- Source: [Google Fonts upstream](https://github.com/google/fonts/tree/main/ofl/plusjakartasans),
  normal variable file `PlusJakartaSans[wght].ttf`, retrieved 30 October 2026.
- SHA-256: `89B3FB38AA0D275D7A731D0D817A4F1622B316B4D7FBDEDCF02EE9099FF68BC8`.
- Original SIL Open Font License 1.1 and copyright notice are distributed alongside
  the font in `public/fonts/plus-jakarta-sans/OFL.txt`.

Regression: `src/lib/font-policy.test.ts` checks the asset signature, license,
CSS family/weight and unchanged CSP. After `npm run build`, run
`node scripts/test-peta-production-font.mjs` for the real Next production server
on loopback. It intercepts synthetic PETA API responses, blocks all remote
requests, verifies the report table and downloaded loaded font, and asserts no
CSP violation or page error on desktop/mobile. It does not use real results,
participant identities, admin tokens, emails or production writes.
