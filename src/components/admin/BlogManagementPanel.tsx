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
import { Badge } from "@/components/ui/badge";
import { useBlogPosts, BlogPost, BlogCategory } from "@/hooks/useBlogPosts";
import { Plus, Edit2, Trash2, Eye, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

export function BlogManagementPanel() {
  return (
    <Tabs defaultValue="posts">
      <TabsList className="mb-6">
        <TabsTrigger value="posts">Blog Posts</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        <BlogPostsTab />
      </TabsContent>

      <TabsContent value="categories">
        <CategoriesTab />
      </TabsContent>
    </Tabs>
  );
}

function BlogPostsTab() {
  const { posts, categories, isLoading, createPost, updatePost, deletePost } = useBlogPosts();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
    category_id: "",
    author_name: "Trade Atlas Team",
    status: "draft" as "draft" | "published" | "archived",
    meta_description: "",
    tags: [] as string[],
    read_time_minutes: 5,
  });

  const handleNew = () => {
    setEditing(null);
    setForm({
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      featured_image_url: "",
      category_id: "",
      author_name: "Trade Atlas Team",
      status: "draft",
      meta_description: "",
      tags: [],
      read_time_minutes: 5,
    });
    setIsOpen(true);
  };

  const handleEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      content: p.content,
      featured_image_url: p.featured_image_url || "",
      category_id: p.category_id || "",
      author_name: p.author_name,
      status: p.status,
      meta_description: p.meta_description || "",
      tags: p.tags || [],
      read_time_minutes: p.read_time_minutes,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      category_id: form.category_id || null,
      featured_image_url: form.featured_image_url || null,
      excerpt: form.excerpt || null,
      meta_description: form.meta_description || null,
      author_avatar_url: null,
      published_at: form.status === "published" && !editing?.published_at ? new Date().toISOString() : editing?.published_at || null,
    };

    if (editing) {
      await updatePost.mutateAsync({ id: editing.id, ...data });
    } else {
      await createPost.mutateAsync(data);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this blog post?")) {
      await deletePost.mutateAsync(id);
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
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Manage blog articles</CardDescription>
            </div>
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-muted-foreground">/{p.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.category && (
                      <Badge variant="outline" style={{ borderColor: p.category.color }}>
                        {p.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.published_at ? format(new Date(p.published_at), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated-from-title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                placeholder="Brief description for previews"
              />
            </div>

            <div className="space-y-2">
              <Label>Content * (HTML supported)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                rows={10}
                placeholder="<p>Your blog post content...</p>"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm(f => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Read Time (minutes)</Label>
                <Input
                  type="number"
                  value={form.read_time_minutes}
                  onChange={(e) => setForm(f => ({ ...f, read_time_minutes: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Featured Image URL</Label>
              <Input
                value={form.featured_image_url}
                onChange={(e) => setForm(f => ({ ...f, featured_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.content}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoriesTab() {
  const { categories, createCategory, deleteCategory } = useBlogPosts();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#D4AF37",
  });

  const handleSave = async () => {
    await createCategory.mutateAsync({
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    });
    setIsOpen(false);
    setForm({ name: "", slug: "", description: "", color: "#D4AF37" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this category?")) {
      await deleteCategory.mutateAsync(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Categories</CardTitle>
              <CardDescription>Organize your blog posts</CardDescription>
            </div>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">/{c.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: c.color }} />
                      <span className="text-sm text-muted-foreground">{c.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="auto-from-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                className="h-10 w-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
