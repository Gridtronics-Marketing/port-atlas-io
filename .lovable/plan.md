

# Simplify Add User Modal — Name Fields + 3 Roles

## Changes to `src/components/AddUserModal.tsx`

### 1. Move First Name / Last Name to always-visible top of form
Currently these fields only appear when "Create Employee Record" is checked. Move them above the email field and make them required.

Update `formSchema`:
- `firstName: z.string().min(1, "First name is required")`
- `lastName: z.string().min(1, "Last name is required")`

### 2. Reduce roles to 3
Replace the `availableRoles` array with only:
- **Administrator** (`admin`) — Full system access and user management
- **Manager** (`project_manager`) — Project oversight and team coordination
- **Employee** (`employee`) — Organization member with HR data and skills tracking

Remove `hr_manager`, `technician`, `viewer` from the selectable list. Existing users with those roles are unaffected — this only changes what's offered in the creation form.

### 3. Pass first/last name to profile and employee record
Update `onSubmit` to:
- Include `first_name`/`last_name` in the `signUp` metadata so the profile trigger can populate `full_name`
- Always pass names when creating the employee record (no longer conditional on fields being filled since they're required)

