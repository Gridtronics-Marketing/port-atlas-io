
# Add Trade Registry Controls to System Settings Page

## What's Missing

The Trade Registry (organization trades, drop point trade assignment) was added but its management UI only exists on the Organization Settings page. The System Settings page (`/settings`) -- where admins go for centralized configuration -- has no trade-related controls.

## Changes

### File: `src/pages/Settings.tsx`

1. **Import** `OrganizationTradesManager` and the `useOrganizationData` hook (to get the current org ID).

2. **Add an "Organization Trades" card** inside the **"Core Configuration"** tab, below the existing System Configuration card. This card will render the `OrganizationTradesManager` component, letting admins manage which trades their organization performs directly from Settings.

3. The card will include a guard -- if no organization is selected, it shows a message directing the user to select one first.

## Technical Details

- Import `OrganizationTradesManager` from `@/components/OrganizationTradesManager`
- Import `useOrganizationData` from `@/hooks/useOrganizationData` to get `organizationId`
- Add a new `<Card>` block in the `core` TabsContent with title "Organization Trades" and description "Select the trades your organization performs. Drop points will be tagged to trades for filtering."
- Inside `CardContent`, conditionally render `<OrganizationTradesManager organizationId={organizationId} />` if `organizationId` exists, otherwise show a muted text prompt.
- No new files, no database changes -- purely wiring an existing component into the Settings page.
