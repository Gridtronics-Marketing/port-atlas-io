

# Rename "Projects" to "Jobs" Across the UI

## Summary
Rename all user-facing instances of "Project" / "Projects" to "Job" / "Jobs" throughout the application. Internal code (variable names, hooks, file names) stays the same — only visible text changes.

## Files to Modify

### 1. `src/components/AppSidebar.tsx`
- Change sidebar item title from `"Projects"` to `"Jobs"`

### 2. `src/components/ClientPortalSidebar.tsx`
- Change `"Projects"` to `"Jobs"` in the navigation items array

### 3. `src/pages/Projects.tsx`
- All user-facing strings: "Project Management" → "Job Management", "My Projects" → "My Jobs", "No projects yet" → "No jobs yet", "Request New Project" → "Request New Job", "Total Projects" → "Total Jobs", "Active Projects" → "Active Jobs", "Completed Projects" → "Completed Jobs", "New Project" → "New Job", "Loading projects..." → "Loading jobs...", etc.

### 4. `src/components/AddProjectModal.tsx`
- Dialog title: "Create New Project" → "Create New Job"
- Description and labels: "project" → "job" in all visible text

### 5. `src/components/EditProjectModal.tsx`
- Dialog title and labels: "Project" → "Job" in all visible text

### 6. `src/components/RequestProjectModal.tsx`
- Dialog title: "Request New Project" → "Request New Job"
- All user-facing text updated

### 7. `src/components/ProjectDashboard.tsx`
- Card titles: "Active Projects" → "Active Jobs", etc.
- Section header: "Active Projects" → "Active Jobs"

### 8. `src/pages/Index.tsx`
- MetricCard title: "Active Projects" → "Active Jobs"
- Card title: "Project Progress" → "Job Progress"
- Button text: "View Projects" → "View Jobs"
- Tooltip/subtitle text updates

No route changes (`/projects` stays as-is), no file renames, no variable renames — purely UI label changes.

