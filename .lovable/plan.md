

# Remove Name Field from Client Portal Invitation Modal

The screenshot shows the "Add Portal User" modal with the **Name** and **Role** fields crossed out. The Role field was already removed previously (hardcoded to 'admin'). The Name field still exists and needs to be removed.

## Changes

**`src/components/CreateClientPortalModal.tsx`**:
- Remove the Name input field from the form
- Remove `userName` state variable
- Auto-derive the name from `client.contact_name` (passed directly to the edge function)
- Update the credentials display card to show the client contact name or just email
- Clean up the `User` icon import if no longer needed

The modal will become: **Email + Password only** — simpler and matching the wish list requirement of a single streamlined flow.

