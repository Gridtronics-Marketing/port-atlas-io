

# Redesign Email Modal (Jobber-style) + File Attachments

## Summary
Redesign the `SendClientEmailModal` to match the Jobber screenshot layout — two-column with email form on the left and attachments panel on the right, cleaner styling with inline To/Subject/Message fields, and drag-and-drop file upload support using Supabase Storage.

## Changes

### 1. New Migration: `email-attachments` storage bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('email-attachments', 'email-attachments', true);
-- RLS: authenticated users can upload/read
```

### 2. `src/components/SendClientEmailModal.tsx` — Full redesign
- **Wider dialog**: `sm:max-w-[800px]` to accommodate two columns
- **Two-column layout**: Left (email form), Right (attachments panel)
- **Left column**:
  - "Send email to {clientName}" as dialog title
  - **To** row: inline label + email chips with `×` remove + red emoji button placeholder + `···` menu for CC
  - **Subject**: borderless input with bottom border only (cleaner look)
  - **Message**: borderless textarea filling remaining space
  - **"Send me a copy"** checkbox at bottom
  - **Cancel / Send Email** buttons in footer
- **Right column — Attachments**:
  - Dashed drop zone: "Drag your files here or **Select a File**"
  - File input triggered by "Select a File" button
  - Drag-and-drop handlers (`onDragOver`, `onDrop`)
  - List of attached files with name, size, and remove button
  - "Client attachments" count and size usage bar (X MB out of 10 MB limit)
  - Files uploaded to `email-attachments` bucket on attach, URLs passed to edge function
- **State additions**: `attachments` array (File objects), `uploadedUrls` array, `uploading` boolean

### 3. `supabase/functions/send-client-email/index.ts` — Add attachments support
- Accept `attachments` array of `{ filename, url }` in request body
- Include attachment links in the HTML body as a styled "Attachments" section at the bottom of the email (since Resend supports attachments via URL, use Resend's `attachments` field with `path` URLs)
- Log attachment count/names in `client_communications`

### 4. `src/components/ClientCommunicationLog.tsx` — Show attachment indicator
- If a communication log entry has attachments, show a 📎 icon

## File Summary
- **New**: storage bucket migration
- **Modified**: `SendClientEmailModal.tsx` (major redesign), `send-client-email/index.ts` (attachments), `ClientCommunicationLog.tsx` (minor)

