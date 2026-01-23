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
import { usePageContent, PageContent } from "@/hooks/usePageContent";
import { Edit2, Eye, Loader2, ExternalLink } from "lucide-react";

const pageRoutes: Record<string, string> = {
  careers: "/careers",
  blog: "/blog",
  help: "/help",
  api: "/api",
  privacy: "/privacy",
  terms: "/terms",
  security: "/security",
};

export function PageContentManagementPanel() {
  const { pages, isLoading, updatePage } = usePageContent();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<PageContent | null>(null);
  const [form, setForm] = useState({
    page_title: "",
    meta_description: "",
    hero_title: "",
    hero_subtitle: "",
    is_published: true,
  });

  const handleEdit = (p: PageContent) => {
    setEditing(p);
    setForm({
      page_title: p.page_title,
      meta_description: p.meta_description || "",
      hero_title: p.hero_title || "",
      hero_subtitle: p.hero_subtitle || "",
      is_published: p.is_published,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    await updatePage.mutateAsync({
      id: editing.id,
      page_title: form.page_title,
      meta_description: form.meta_description || null,
      hero_title: form.hero_title || null,
      hero_subtitle: form.hero_subtitle || null,
      is_published: form.is_published,
    });
    setIsOpen(false);
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
          <CardTitle>Page Settings</CardTitle>
          <CardDescription>Manage SEO and hero content for public pages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{p.page_slug}</span>
                      <a 
                        href={pageRoutes[p.page_slug] || `/${p.page_slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {p.page_title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Published" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Page: {editing?.page_slug}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page Title (SEO)</Label>
              <Input
                value={form.page_title}
                onChange={(e) => setForm(f => ({ ...f, page_title: e.target.value }))}
                placeholder="Page Title | Trade Atlas"
              />
            </div>

            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                rows={2}
                placeholder="Brief description for search engines..."
              />
            </div>

            <div className="space-y-2">
              <Label>Hero Title</Label>
              <Input
                value={form.hero_title}
                onChange={(e) => setForm(f => ({ ...f, hero_title: e.target.value }))}
                placeholder="Main headline on the page"
              />
            </div>

            <div className="space-y-2">
              <Label>Hero Subtitle</Label>
              <Textarea
                value={form.hero_subtitle}
                onChange={(e) => setForm(f => ({ ...f, hero_subtitle: e.target.value }))}
                rows={2}
                placeholder="Supporting text below the headline"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: v }))} />
              <Label>Published (visible to public)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
