import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useHelpArticles, HelpArticle } from "@/hooks/useHelpArticles";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";

export function HelpArticlesManagementPanel() {
  const { articles, isLoading, createArticle, updateArticle, deleteArticle } = useHelpArticles();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<HelpArticle | null>(null);
  const [form, setForm] = useState({
    category: "",
    title: "",
    content: "",
    sort_order: 0,
    is_published: true,
  });

  const handleNew = () => {
    setEditing(null);
    setForm({
      category: "",
      title: "",
      content: "",
      sort_order: (articles?.length || 0) + 1,
      is_published: true,
    });
    setIsOpen(true);
  };

  const handleEdit = (a: HelpArticle) => {
    setEditing(a);
    setForm({
      category: a.category,
      title: a.title,
      content: a.content,
      sort_order: a.sort_order,
      is_published: a.is_published,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateArticle.mutateAsync({ id: editing.id, ...form });
    } else {
      await createArticle.mutateAsync(form);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this help article?")) {
      await deleteArticle.mutateAsync(id);
    }
  };

  // Get unique categories
  const categories = [...new Set(articles?.map(a => a.category) || [])];

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
              <CardTitle>Help Articles</CardTitle>
              <CardDescription>Manage help center content</CardDescription>
            </div>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.category}</Badge>
                  </TableCell>
                  <TableCell>{a.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={a.is_published ? "default" : "secondary"}>
                      {a.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!articles || articles.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No help articles yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Help Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Getting Started"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="How to create your first project"
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                rows={6}
                placeholder="Answer to the question..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: v }))} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.category || !form.title || !form.content}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
