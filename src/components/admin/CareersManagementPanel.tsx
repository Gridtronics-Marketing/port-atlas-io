import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useJobListings, JobListing } from "@/hooks/useJobListings";
import { Plus, Edit2, Trash2, Loader2, MapPin, Briefcase } from "lucide-react";

export function CareersManagementPanel() {
  const { jobs, isLoading, createJob, updateJob, deleteJob } = useJobListings();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<JobListing | null>(null);
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "Remote",
    employment_type: "Full-time" as JobListing["employment_type"],
    description: "",
    requirements: [] as string[],
    benefits: [] as string[],
    salary_range: "",
    is_active: true,
    application_url: "",
  });
  const [requirementsText, setRequirementsText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");

  const handleNew = () => {
    setEditing(null);
    setForm({
      title: "",
      department: "",
      location: "Remote",
      employment_type: "Full-time",
      description: "",
      requirements: [],
      benefits: [],
      salary_range: "",
      is_active: true,
      application_url: "",
    });
    setRequirementsText("");
    setBenefitsText("");
    setIsOpen(true);
  };

  const handleEdit = (j: JobListing) => {
    setEditing(j);
    setForm({
      title: j.title,
      department: j.department,
      location: j.location,
      employment_type: j.employment_type,
      description: j.description,
      requirements: j.requirements,
      benefits: j.benefits,
      salary_range: j.salary_range || "",
      is_active: j.is_active,
      application_url: j.application_url || "",
    });
    setRequirementsText(j.requirements.join("\n"));
    setBenefitsText(j.benefits.join("\n"));
    setIsOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      requirements: requirementsText.split("\n").filter(r => r.trim()),
      benefits: benefitsText.split("\n").filter(b => b.trim()),
      salary_range: form.salary_range || null,
      application_url: form.application_url || null,
    };

    if (editing) {
      await updateJob.mutateAsync({ id: editing.id, ...data });
    } else {
      await createJob.mutateAsync(data);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this job listing?")) {
      await deleteJob.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Listings</CardTitle>
              <CardDescription>Manage career opportunities</CardDescription>
            </div>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs?.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell>{j.department}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {j.location}
                  </TableCell>
                  <TableCell>{j.employment_type}</TableCell>
                  <TableCell>
                    <Badge variant={j.is_active ? "default" : "secondary"}>
                      {j.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(j)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(j.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!jobs || jobs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No job listings yet. Add your first position.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Job" : "New Job Listing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Engineering"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Remote"
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={(v: any) => setForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input
                  value={form.salary_range}
                  onChange={(e) => setForm(f => ({ ...f, salary_range: e.target.value }))}
                  placeholder="$100k - $150k"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements (one per line)</Label>
              <Textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={4}
                placeholder="5+ years of experience in software development&#10;Proficiency in React and TypeScript&#10;..."
              />
            </div>

            <div className="space-y-2">
              <Label>Benefits (one per line)</Label>
              <Textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                rows={3}
                placeholder="Competitive salary&#10;Health insurance&#10;Flexible hours"
              />
            </div>

            <div className="space-y-2">
              <Label>Application URL</Label>
              <Input
                value={form.application_url}
                onChange={(e) => setForm(f => ({ ...f, application_url: e.target.value }))}
                placeholder="https://jobs.lever.co/..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active (visible on careers page)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.department || !form.description}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
