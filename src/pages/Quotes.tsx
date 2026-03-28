import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface QuoteRow {
  id: string;
  quote_number: string;
  issue_date: string | null;
  valid_until: string | null;
  total: number | null;
  status: string | null;
  client: { name: string } | null;
}

const Quotes = () => {
  const { currentOrganization } = useOrganization();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const query = supabase
        .from("client_quotes")
        .select("id, quote_number, issue_date, valid_until, total, status, client:clients(name)")
        .order("issue_date", { ascending: false });

      if (currentOrganization?.id) {
        query.eq("organization_id", currentOrganization.id);
      }

      const { data } = await query;
      setQuotes((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [currentOrganization?.id]);

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      !search ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDraft = quotes.filter((q) => q.status === "draft").reduce((s, q) => s + (q.total || 0), 0);
  const totalSent = quotes.filter((q) => q.status === "sent").reduce((s, q) => s + (q.total || 0), 0);
  const totalAccepted = quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + (q.total || 0), 0);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "accepted": return <Badge className="bg-success/10 text-success border-success/20">Accepted</Badge>;
      case "sent": return <Badge className="bg-primary/10 text-primary border-primary/20">Sent</Badge>;
      case "declined": return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Quotes | Trade Atlas</title></Helmet>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground">Overview of all client quotes</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">${totalDraft.toLocaleString()}</p><p className="text-sm text-muted-foreground">Draft</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">${totalSent.toLocaleString()}</p><p className="text-sm text-muted-foreground">Sent</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">${totalAccepted.toLocaleString()}</p><p className="text-sm text-muted-foreground">Accepted</p></div></CardContent></Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search quotes..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No quotes found</TableCell></TableRow>
              ) : filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.quote_number}</TableCell>
                  <TableCell>{q.client?.name || "—"}</TableCell>
                  <TableCell>{q.issue_date ? new Date(q.issue_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-medium">${(q.total || 0).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(q.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};

export default Quotes;
