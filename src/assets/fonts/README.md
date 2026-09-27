# Profile Open Graph fonts

Bundled locally so social preview rendering does not depend on Google Fonts requests.

- Gentium Book Plus Regular — SIL International, SIL Open Font License. [Source](https://github.com/google/fonts/tree/main/ofl/gentiumbookplus). License: `GentiumBookPlus-OFL.txt`.
- Be Vietnam Pro Regular — The Be Vietnam Pro Project Authors, SIL Open Font License. [Source](https://github.com/google/fonts/tree/main/ofl/bevietnampro). License: `BeVietnamPro-OFL.txt`.

Both include Vietnamese glyphs. The profile route runs in Node.js; `outputFileTracingIncludes` includes these TTFs in standalone builds.

Run `npx tsx scripts/preview-profile-og.tsx` to generate synthetic visual fixtures in the OS temporary directory. It does not access user data or update the database.
