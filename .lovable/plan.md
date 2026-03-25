

# Update Schedule Assignment Modal

## Summary
Two changes: rename "Project" to "Job" in the scheduling modal, and ensure the employee dropdown filters by the current organization (already handled by `useEmployees` which filters by `organizationId` internally).

## Changes

### 1. Modify: `src/components/ScheduleAssignmentModal.tsx`
- Line 240: Change label from `"Project (Optional)"` to `"Job (Optional)"`
- Line 246: Change placeholder from `"Select project"` to `"Select job"`
- Line 249: Change fallback text from `"No Project"` to `"No Job"`

The employee dropdown already loads org-filtered employees via `useEmployees` which uses `useOrganizationData` internally. No changes needed there -- if employees aren't showing, it's a data issue not a code issue.

### 2. Verify: `src/pages/Scheduling.tsx`
- Check for any other "Project" labels on the scheduling page that need renaming to "Job".

