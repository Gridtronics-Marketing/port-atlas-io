import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface ExpenseRow {
  id: string;
  expense_date: string | null;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  status: string | null;
  client: { name: string } | null;
}

const Expenses = () => {
  const { currentOrganization } = useOrganization();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const query = supabase
        .from("client_expenses")
        .select("id, expense_date, category, vendor, description, amount, status, client:clients(name)")
        .order("expense_date", { ascending: false });

      if (currentOrganization?.id) {
        query.eq("organization_id", currentOrganization.id);
      }

      const { data } = await query;
      setExpenses((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [currentOrganization?.id]);

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      !search ||
      e.vendor?.toLowerCase().includes(search.toLowerCase()) ||
      e.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalPending = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved": return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case "pending": return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status || "Draft"}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Expenses | Trade Atlas</title></Helmet>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Overview of all client expenses</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">${totalPending.toLocaleString()}</p><p className="text-sm text-muted-foreground">Pending</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">${totalApproved.toLocaleString()}</p><p className="text-sm text-muted-foreground">Approved</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">${totalThisMonth.toLocaleString()}</p><p className="text-sm text-muted-foreground">This Month</p></div></CardContent></Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses found</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{e.client?.name || "—"}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.vendor || "—"}</TableCell>
                  <TableCell className="text-right font-medium">${e.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(e.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};

export default Expenses;
