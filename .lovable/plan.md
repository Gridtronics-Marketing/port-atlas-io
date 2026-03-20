

## Update Version to 1.10.10

Bump the version and add a changelog entry for the room view photo grey box fix.

### File: `src/lib/version.ts`

**Line 1**: Change `APP_VERSION` from `"1.10.9"` to `"1.10.10"`

**Lines 9-23**: Add new version entry at the top of `VERSION_HISTORY`:
```typescript
{
  version: "1.10.10",
  date: "2026-03-20",
  changes: [
    "Fixed grey box on room view photo upload preview by using SignedImage component",
    "Fixed room view photos tab showing grey boxes due to incorrect storage bucket metadata",
    "Added photo-bucket-resolver utility to automatically route room view photos to correct storage bucket",
    "Database migration to repair existing room view photo records with wrong bucket reference",
  ]
},
```

