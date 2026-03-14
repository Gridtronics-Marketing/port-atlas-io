

# Remove "Assign Role to Existing User" Button from User Management

## Change

**`src/pages/UserManagement.tsx`** (lines 290-297): Delete the "Assign Role to Existing User" button. The "Add New User" button and bulk role assignment remain.

No other files need changes — the `ManualRoleAssignmentModal` component and `showManualRoleModal` state can optionally be cleaned up too, but removing the button is the primary ask.

