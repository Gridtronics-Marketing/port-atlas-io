

# Flow: Service Request → Approve → Create Work Order → Append to Job

## Current State
- Service requests can be approved and converted to work orders via `ConvertToWorkOrderModal`
- Work orders have a `project_id` field but the "Convert to Work Order" modal does NOT include a job selector
- There's no way to link the created work order to an existing job during conversion

## What's Missing
The `ConvertToWorkOrderModal` needs a **Job selector** so that when creating a work order from an approved service request, the user can assign it to an existing job (or leave unassigned).

## Changes

### 1. Modify: `src/components/ConvertToWorkOrderModal.tsx`
- Import `useProjects` hook
- Add `project_id` to `formData` state (default empty string)
- Add a **"Assign to Job (Optional)"** select dropdown (similar pattern to the existing "Assign To" employee dropdown)
  - Lists active jobs from `useProjects`
  - Shows job name and client name
- Pass `project_id` to `addWorkOrder()` call when creating the work order

### 2. Modify: `src/components/ServiceRequestsManager.tsx`
- In the "Pending Requests" section, add a streamlined flow:
  - When clicking "Approve", auto-prompt to convert to work order (currently these are separate steps)
  - Add a combined **"Approve & Create Work Order"** action in the dropdown menu that approves the request AND opens the ConvertToWorkOrderModal in one step

This keeps the existing flow intact while adding the job assignment step to the work order creation modal.

