import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  Users, 
  Building2, 
  Activity, 
  FileText, 
  MessageSquarePlus,
  AlertTriangle, 
  ArrowRight, 
  Calendar,
  ClipboardList,
  Briefcase,
  DollarSign,
  ChevronRight,
  Clock,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddLocationModal } from "@/components/AddLocationModal";
import { useLocations } from "@/hooks/useLocations";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useContracts } from "@/hooks/useContracts";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ClientPortalDashboard from "@/pages/ClientPortalDashboard";

const formatCurrency = (val: number) =>
  val >= 1000 ? `$${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : `$${val.toFixed(0)}`;

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  const { isClientPortalUser } = useOrganization();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { contracts } = useContracts();
  const { serviceRequests } = useServiceRequests();

  // Fetch user profile for greeting
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) {
          setFirstName(data.full_name.split(" ")[0]);
        }
      });
  }, [user?.id]);

  if (isClientPortalUser) {
    return <ClientPortalDashboard />;
  }

  // Date formatting
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // === Workflow pipeline metrics ===
  const pendingRequests = serviceRequests.filter(sr => sr.status === "pending").length;
  const assessedRequests = serviceRequests.filter(sr => sr.status === "reviewed" || sr.status === "approved").length;
  const overdueRequests = serviceRequests.filter(sr => {
    const age = Date.now() - new Date(sr.created_at).getTime();
    return sr.status === "pending" && age > 7 * 24 * 60 * 60 * 1000;
  }).length;

  const draftQuotes = contracts.filter(c => c.status === "draft").length;
  const approvedQuotes = contracts.filter(c => c.status === "active" || c.status === "approved").length;
  const totalQuoteValue = contracts
    .filter(c => c.status === "draft" || c.status === "pending")
    .reduce((sum, c) => sum + Number(c.contract_value || 0), 0);

  const activeJobs = projects.filter(p => p.status !== "Completed").length;
  const completedJobs = projects.filter(p => p.status === "Completed").length;
  const totalJobValue = contracts
    .filter(c => c.status === "active")
    .reduce((sum, c) => sum + Number(c.contract_value || 0), 0);

  const awaitingPayment = contracts.filter(c => c.status === "completed" || c.status === "pending_payment").length;
  const pastDue = contracts.filter(c => {
    return c.end_date && new Date(c.end_date) < today && c.status === "active";
  }).length;
  const invoiceValue = contracts
    .filter(c => c.status === "completed" || c.status === "pending_payment")
    .reduce((sum, c) => sum + Number(c.contract_value || 0), 0);

  // Pipeline totals for segment bar
  const pipelineTotal = Math.max(pendingRequests + approvedQuotes + activeJobs + awaitingPayment, 1);
  const segments = [
    { pct: (pendingRequests / pipelineTotal) * 100, color: "bg-warning" },
    { pct: (approvedQuotes / pipelineTotal) * 100, color: "bg-primary" },
    { pct: (activeJobs / pipelineTotal) * 100, color: "bg-success" },
    { pct: (awaitingPayment / pipelineTotal) * 100, color: "bg-info" },
  ];

  // === Today's work orders ===
  const todayStr = today.toISOString().split("T")[0];
  const todaysOrders = workOrders.filter(wo => wo.due_date?.startsWith(todayStr));
  const overdueOrders = workOrders.filter(
    wo => wo.due_date && new Date(wo.due_date) < today && wo.status !== "Completed"
  );

  // Recent pending requests
  const recentPendingRequests = serviceRequests
    .filter(sr => sr.status === "pending")
    .slice(0, 3);

  return (
    <div className="min-h-full bg-background">
      {/* Header: Date + Greeting */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 lg:px-6 py-5 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{dateStr}</p>
              <h1 className="text-2xl font-semibold text-foreground mt-1">
                {getGreeting()}{firstName ? `, ${firstName}` : ""}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddLocation(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Location
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/work-orders">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Work Orders
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* Overdue Alert */}
        {overdueOrders.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {overdueOrders.length} overdue work order{overdueOrders.length > 1 ? "s" : ""} require attention
              </p>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link to="/work-orders">View All</Link>
            </Button>
          </div>
        )}

        {/* Workflow Pipeline Bar */}
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            {/* Colored segment bar */}
            <div className="flex h-2">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className={cn(seg.color, "transition-all")}
                  style={{ width: `${Math.max(seg.pct, seg.pct > 0 ? 8 : 0)}%` }}
                />
              ))}
            </div>

            {/* Pipeline cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
              <PipelineStage
                label="Requests"
                icon={MessageSquarePlus}
                count={pendingRequests}
                colorClass="text-warning"
                bgClass="bg-warning/10"
                stats={[
                  { label: "Assessed", value: assessedRequests },
                  { label: "Overdue", value: overdueRequests, warn: overdueRequests > 0 },
                ]}
                onClick={() => navigate("/service-requests")}
              />
              <PipelineStage
                label="Quotes"
                icon={FileText}
                count={approvedQuotes}
                amount={totalQuoteValue}
                colorClass="text-primary"
                bgClass="bg-primary/10"
                stats={[
                  { label: "Drafts", value: draftQuotes },
                  { label: "Approved", value: approvedQuotes },
                ]}
                onClick={() => navigate("/contracts")}
              />
              <PipelineStage
                label="Jobs"
                icon={Briefcase}
                count={activeJobs}
                amount={totalJobValue}
                colorClass="text-success"
                bgClass="bg-success/10"
                stats={[
                  { label: "Active", value: activeJobs },
                  { label: "Completed", value: completedJobs },
                ]}
                onClick={() => navigate("/projects")}
              />
              <PipelineStage
                label="Invoices"
                icon={DollarSign}
                count={awaitingPayment}
                amount={invoiceValue}
                colorClass="text-info"
                bgClass="bg-info/10"
                stats={[
                  { label: "Awaiting", value: awaitingPayment },
                  { label: "Past due", value: pastDue, warn: pastDue > 0 },
                ]}
                onClick={() => navigate("/contracts")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: Today's Schedule + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Today's Schedule</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {todaysOrders.length} work order{todaysOrders.length !== 1 ? "s" : ""} scheduled
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/scheduling">
                      View Schedule
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Summary stats row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <MiniStat label="Total" value={workOrders.length} />
                  <MiniStat label="Active" value={workOrders.filter(wo => wo.status === "In Progress").length} accent />
                  <MiniStat label="Completed" value={workOrders.filter(wo => wo.status === "Completed").length} />
                  <MiniStat label="Overdue" value={overdueOrders.length} warn={overdueOrders.length > 0} />
                </div>

                {/* Overdue list */}
                {overdueOrders.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requires Attention</p>
                    {overdueOrders.slice(0, 5).map(wo => (
                      <div
                        key={wo.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/10 hover:bg-destructive/10 cursor-pointer transition-colors"
                        onClick={() => navigate("/work-orders")}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{wo.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : "N/A"} · {wo.priority}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-[10px] ml-2">Overdue</Badge>
                      </div>
                    ))}
                  </div>
                ) : todaysOrders.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheduled Today</p>
                    {todaysOrders.slice(0, 5).map(wo => (
                      <div
                        key={wo.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate("/work-orders")}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{wo.title}</p>
                          <p className="text-xs text-muted-foreground">{wo.priority} priority</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] ml-2">{wo.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No work orders scheduled for today</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/work-orders">View All Work Orders</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Performance */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-success" />
                  </div>
                  <CardTitle className="text-base">Business Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xl font-bold tabular-nums">{clients.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Clients</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xl font-bold tabular-nums">{locations.filter(l => l.status === "Active").length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Active Sites</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
                    <div className="text-xl font-bold text-success tabular-nums">{completedJobs}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Jobs Done</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xl font-bold text-primary tabular-nums">{contracts.filter(c => c.status === "active").length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Contracts</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/projects">
                    View All Jobs
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <MessageSquarePlus className="h-4 w-4 text-warning" />
                  </div>
                  <CardTitle className="text-base">Recent Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPendingRequests.length > 0 ? (
                  recentPendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate("/service-requests")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {req.requesting_organization?.name || "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge
                          variant={req.priority === "urgent" ? "destructive" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {req.priority}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimeAgo(req.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/service-requests">
                    View All Requests
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <QuickActionButton to="/locations" icon={MapPin} label="Manage Sites" />
                <QuickActionButton to="/employees" icon={Users} label="Team Management" />
                <QuickActionButton to="/clients" icon={Building2} label="Client Portal" />
                <QuickActionButton to="/scheduling" icon={Calendar} label="Scheduling" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddLocationModal open={showAddLocation} onOpenChange={setShowAddLocation} />
    </div>
  );
};

// === Sub-components ===

import { cn } from "@/lib/utils";

interface PipelineStageProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  amount?: number;
  colorClass: string;
  bgClass: string;
  stats: { label: string; value: number; warn?: boolean }[];
  onClick: () => void;
}

const PipelineStage = ({ label, icon: Icon, count, amount, colorClass, bgClass, stats, onClick }: PipelineStageProps) => (
  <div
    className="p-4 lg:p-5 hover:bg-muted/30 cursor-pointer transition-colors group"
    onClick={onClick}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", bgClass)}>
        <Icon className={cn("h-3.5 w-3.5", colorClass)} />
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground ml-auto transition-colors" />
    </div>
    <div className="flex items-baseline gap-2 mb-2">
      <span className="text-2xl font-bold tabular-nums">{count}</span>
      {amount != null && amount > 0 && (
        <span className="text-sm font-medium text-muted-foreground">{formatCurrency(amount)}</span>
      )}
    </div>
    <div className="flex gap-3">
      {stats.map((s, i) => (
        <span key={i} className={cn("text-[11px]", s.warn ? "text-destructive font-medium" : "text-muted-foreground")}>
          {s.value} {s.label}
        </span>
      ))}
    </div>
  </div>
);

const MiniStat = ({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) => (
  <div className={cn(
    "text-center p-2.5 rounded-lg border",
    warn ? "bg-destructive/5 border-destructive/15" : accent ? "bg-primary/5 border-primary/15" : "bg-muted/40"
  )}>
    <div className={cn("text-lg font-bold tabular-nums", warn ? "text-destructive" : accent ? "text-primary" : "")}>
      {value}
    </div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

interface QuickActionButtonProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const QuickActionButton = ({ to, icon: Icon, label }: QuickActionButtonProps) => (
  <Button
    variant="ghost"
    className="w-full justify-between h-10 px-3 text-sm font-normal hover:bg-muted/50 group"
    asChild
  >
    <Link to={to}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span>{label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  </Button>
);

export default Index;
