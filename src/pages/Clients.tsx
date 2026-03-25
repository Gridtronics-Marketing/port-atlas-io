import { useState, useMemo } from "react";
import { Plus, Search, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddClientModal } from "@/components/AddClientModal";
import { ClientDetailsModal } from "@/components/ClientDetailsModal";
import { useClients, Client } from "@/hooks/useClients";

const statusFilters = ["All", "Active", "Pending", "Inactive"] as const;

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

const Clients = () => {
  const { clients, loading, addClient, updateClient, deleteClient, fetchClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const newLeads = clients.filter(c => c.status === "Pending" && new Date(c.created_at) >= thirtyDaysAgo).length;
  const newClients = clients.filter(c => c.status === "Active" && new Date(c.created_at) >= thirtyDaysAgo).length;
  const totalYTD = clients.filter(c => new Date(c.created_at) >= yearStart).length;

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = !searchTerm ||
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contact_name && client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.contact_email && client.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "All" ||
        client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const stats = [
    { label: "New leads", value: newLeads, sub: "Past 30 days" },
    { label: "New clients", value: newClients, sub: "Past 30 days" },
    { label: "Total new clients", value: totalYTD, sub: "Year to date" },
  ];

  return (
    <>
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border">
                <DropdownMenuItem>Export CSV</DropdownMenuItem>
                <DropdownMenuItem>Bulk Import</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-none border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredClients.length} result{filteredClients.length !== 1 ? "s" : ""}
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[220px]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading clients…
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {clients.length === 0 ? "No clients yet" : "No clients match your filters"}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedClient(client);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium text-foreground">{client.name}</span>
                        {client.contact_name && (
                          <p className="text-xs text-muted-foreground">{client.contact_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.address || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            client.status === "Active"
                              ? "bg-success"
                              : client.status === "Pending"
                              ? "bg-warning"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-sm">{client.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {timeAgo(client.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={addClient}
      />

      <ClientDetailsModal
        client={selectedClient}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedClient(null);
        }}
        onUpdateClient={updateClient}
        onDeleteClient={deleteClient}
        onRefreshClient={fetchClients}
      />
    </>
  );
};

export default Clients;
