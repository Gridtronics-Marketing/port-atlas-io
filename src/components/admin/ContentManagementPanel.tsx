import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { useFAQs, FAQItem } from "@/hooks/useFAQs";
import { Plus, Edit2, Trash2, Star, Loader2 } from "lucide-react";

export function ContentManagementPanel() {
  return (
    <Tabs defaultValue="testimonials">
      <TabsList className="mb-6">
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
      </TabsList>

      <TabsContent value="testimonials">
        <TestimonialsTab />
      </TabsContent>

      <TabsContent value="faqs">
        <FAQsTab />
      </TabsContent>
    </Tabs>
  );
}

function TestimonialsTab() {
  const { testimonials, isLoading, createTestimonial, updateTestimonial, deleteTestimonial } = useTestimonials();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({
    author_name: "",
    author_title: "",
    company_name: "",
    quote: "",
    rating: 5,
    is_featured: false,
    is_active: true,
    sort_order: 0,
  });

  const handleNew = () => {
    setEditing(null);
    setForm({
      author_name: "",
      author_title: "",
      company_name: "",
      quote: "",
      rating: 5,
      is_featured: false,
      is_active: true,
      sort_order: (testimonials?.length || 0) + 1,
    });
    setIsOpen(true);
  };

  const handleEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      author_name: t.author_name,
      author_title: t.author_title || "",
      company_name: t.company_name || "",
      quote: t.quote,
      rating: t.rating || 5,
      is_featured: t.is_featured,
      is_active: t.is_active,
      sort_order: t.sort_order,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    const data = {
      author_name: form.author_name,
      author_title: form.author_title || null,
      company_name: form.company_name || null,
      quote: form.quote,
      avatar_url: null,
      rating: form.rating,
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    if (editing) {
      await updateTestimonial.mutateAsync({ id: editing.id, ...data });
    } else {
      await createTestimonial.mutateAsync(data);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this testimonial?")) {
      await deleteTestimonial.mutateAsync(id);
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
              <CardTitle>Testimonials</CardTitle>
              <CardDescription>Customer quotes displayed on the marketing site</CardDescription>
            </div>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{t.author_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.author_title} {t.company_name && `at ${t.company_name}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{t.quote}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < (t.rating || 0) ? "fill-primary text-primary" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.is_featured && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Featured</span>}
                      {!t.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Author Name *</Label>
              <Input
                value={form.author_name}
                onChange={(e) => setForm(f => ({ ...f, author_name: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.author_title}
                  onChange={(e) => setForm(f => ({ ...f, author_title: e.target.value }))}
                  placeholder="Operations Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea
                value={form.quote}
                onChange={(e) => setForm(f => ({ ...f, quote: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={form.rating.toString()} onValueChange={(v) => setForm(f => ({ ...f, rating: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={r.toString()}>{r} Star{r > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm(f => ({ ...f, is_featured: v }))} />
                <Label>Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.author_name || !form.quote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FAQsTab() {
  const { faqs, isLoading, createFAQ, updateFAQ, deleteFAQ } = useFAQs();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "general",
    is_active: true,
    sort_order: 0,
  });

  const handleNew = () => {
    setEditing(null);
    setForm({
      question: "",
      answer: "",
      category: "general",
      is_active: true,
      sort_order: (faqs?.length || 0) + 1,
    });
    setIsOpen(true);
  };

  const handleEdit = (f: FAQItem) => {
    setEditing(f);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      is_active: f.is_active,
      sort_order: f.sort_order,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateFAQ.mutateAsync({ id: editing.id, ...form });
    } else {
      await createFAQ.mutateAsync(form);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this FAQ?")) {
      await deleteFAQ.mutateAsync(id);
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
              <CardTitle>FAQ Items</CardTitle>
              <CardDescription>Questions displayed on the pricing and help pages</CardDescription>
            </div>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs?.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="max-w-md">
                    <p className="font-medium truncate">{f.question}</p>
                  </TableCell>
                  <TableCell className="capitalize">{f.category}</TableCell>
                  <TableCell>
                    {!f.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "New FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question *</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer *</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.question || !form.answer}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
