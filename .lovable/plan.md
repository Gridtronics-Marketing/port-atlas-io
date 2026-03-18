

# Fix PRD Header URLs

## What to change

In `src/pages/DocsPage.tsx`, update two lines in the `PRD_CONTENT` string (lines 31-32):

1. **Line 31**: Change `https://port-atlas-io.lovable.app` → `https://runwithatlas.com`
2. **Line 32**: Remove the entire `**Project URL:**` line (the Lovable project link)

These are simple string replacements inside the PRD content constant.

