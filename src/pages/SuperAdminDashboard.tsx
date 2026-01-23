import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { LeadManagementPanel } from "@/components/admin/LeadManagementPanel";
import { PricingManagementPanel } from "@/components/admin/PricingManagementPanel";
import { ContentManagementPanel } from "@/components/admin/ContentManagementPanel";
import { PlatformSettingsPanel } from "@/components/admin/PlatformSettingsPanel";
import { BlogManagementPanel } from "@/components/admin/BlogManagementPanel";
import { CareersManagementPanel } from "@/components/admin/CareersManagementPanel";
import { HelpArticlesManagementPanel } from "@/components/admin/HelpArticlesManagementPanel";
import { PageContentManagementPanel } from "@/components/admin/PageContentManagementPanel";
import { useLeads } from "@/hooks/useLeads";
import { MetricCard } from "@/components/ui/metric-card";
import { Users, TrendingUp, DollarSign, Target, LayoutDashboard, UserPlus, CreditCard, FileText, Settings, Newspaper, Briefcase, HelpCircle, Globe } from "lucide-react";

export default function SuperAdminDashboard() {
  const { isSuperAdmin, loadingOrganizations } = useOrganization();
  const { getLeadMetrics, leads } = useLeads();
  const metrics = getLeadMetrics();

  if (loadingOrganizations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Calculate recent leads (last 7 days)
  const recentLeads = leads?.filter(l => {
    const createdDate = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }) || [];

  const conversionRate = metrics.total > 0 
    ? Math.round((metrics.converted / metrics.total) * 100) 
    : 0;

  return (
    <>
      <Helmet>
        <title>Super Admin Dashboard | Trade Atlas</title>
      </Helmet>

      <div className="container px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Platform Administration</h1>
          <p className="text-muted-foreground mt-1">
            Manage leads, pricing, content, and platform settings.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="careers" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Careers</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Pages</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Leads"
                value={metrics.total}
                icon={Users}
                subtitle={`${recentLeads.length} new this week`}
                variant="default"
              />
              <MetricCard
                title="New Leads"
                value={metrics.new}
                icon={UserPlus}
                subtitle="Awaiting contact"
                variant="primary"
              />
              <MetricCard
                title="Converted"
                value={metrics.converted}
                icon={TrendingUp}
                subtitle={`${conversionRate}% conversion rate`}
                variant="success"
              />
              <MetricCard
                title="In Pipeline"
                value={metrics.contacted + metrics.qualified}
                icon={Target}
                subtitle="Active opportunities"
                variant="warning"
              />
            </div>

            {/* Recent Leads Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Last 10 leads received</CardDescription>
              </CardHeader>
              <CardContent>
                {leads && leads.length > 0 ? (
                  <div className="space-y-4">
                    {leads.slice(0, 10).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-foreground">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                          {lead.company_name && (
                            <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            lead.status === 'qualified' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                            lead.status === 'converted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {lead.status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No leads yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <LeadManagementPanel />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <PricingManagementPanel />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <ContentManagementPanel />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <BlogManagementPanel />
          </TabsContent>

          {/* Careers Tab */}
          <TabsContent value="careers">
            <CareersManagementPanel />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help">
            <HelpArticlesManagementPanel />
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages">
            <PageContentManagementPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <PlatformSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
