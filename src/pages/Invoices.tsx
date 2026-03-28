import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  total: number | null;
  status: string | null;
  client: { name: string } | null;
}

const Invoices = () => {
  const { currentOrganization } = useOrganization();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const query = supabase
        .from("client_invoices")
        .select("id, invoice_number, issue_date, due_date, total, status, client:clients(name)")
        .order("issue_date", { ascending: false });

      if (currentOrganization?.id) {
        query.eq("organization_id", currentOrganization.id);
      }

      const { data } = await query;
      setInvoices((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [currentOrganization?.id]);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDraft = invoices.filter((i) => i.status === "draft").reduce((s, i) => s + (i.total || 0), 0);
  const totalSent = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.total || 0), 0);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid": return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
      case "sent": return <Badge className="bg-primary/10 text-primary border-primary/20">Sent</Badge>;
      case "overdue": return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Invoices | Trade Atlas</title></Helmet>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Overview of all client invoices</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">${totalDraft.toLocaleString()}</p><p className="text-sm text-muted-foreground">Draft</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">${totalSent.toLocaleString()}</p><p className="text-sm text-muted-foreground">Sent</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p><p className="text-sm text-muted-foreground">Paid</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><AlertCircle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">${totalOverdue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Overdue</p></div></CardContent></Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
              ) : filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.client?.name || "—"}</TableCell>
                  <TableCell>{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-medium">${(inv.total || 0).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};

export default Invoices;
