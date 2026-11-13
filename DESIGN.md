# Agent eval design

This is a local research tool for PostHog engineers. Users define evals,
compare sessions, and inspect the evidence for each judge decision.

Use the official assets and guidance at https://brand.posthog.com/.
Keep the dense dark layout from the supplied session screenshots.
Do not add marketing sections or decorative dashboard cards.

- Font: bundled RoundHog, with 400, 500, and 700 weights. Body text is 13px.
- Code and transcripts: the system monospace font, 12px.
- Main surface: #151515. Raised surface: #202020. Borders: #393939.
- Text: #f5f3ef. Secondary text: #aaa9a6.
- Links and focus: PostHog blue lighter, #A1D3F7.
- Primary actions: PostHog lemon, #FFCE1C, with dark text.
- Pass: PostHog teal, #43DAB3. Fail: coral lighter, #FFB8BA.
- Logo: official white landscape logo on the dark sidebar.
- Icons: official PostHog icons. Research hedgehog: sidebar footer only.

Keep criteria collapsed on the eval screen. Expose full criteria in
keyboard-accessible tooltips. Show status as text as well as color.
Use chronological, numbered transcript entries with expandable tool
output and explicit filters. Judge feedback sits beside the transcript
on wide screens and below it on narrow screens.

Shared tokens live in web/src/styles/base.css. Asset provenance and
licenses live in web/public/brand. All brand assets must work offline.
