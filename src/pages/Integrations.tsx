import { ReportingDashboard } from '@/components/ReportingDashboard';
import { IntegrationsManager } from '@/components/IntegrationsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Plug } from 'lucide-react';

const Integrations = () => {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Integrations & Reporting
        </h1>
        <p className="text-muted-foreground mt-1">
          Analytics dashboards, data exports, and third-party integrations
        </p>
      </div>

      <Tabs defaultValue="reporting" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reporting">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reporting & Analytics
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reporting" className="space-y-6">
          <ReportingDashboard />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsManager />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Integrations;