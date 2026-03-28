

# Remove Locations from Sidebar

## Summary
Remove the "Locations" menu item from the sidebar since location management is now handled within the Client Details modal (as "Properties").

## Change

### `src/components/AppSidebar.tsx`
- Remove the `{ title: "Locations", url: "/locations", icon: MapPin }` entry from the Operations group items array (around line 79)
- Remove the `MapPin` import if no longer used elsewhere in the file

