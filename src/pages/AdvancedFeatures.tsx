import { useState } from 'react';
import { DollarSign, Package, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { InventoryManager } from '@/components/InventoryManager';
import { FinancialDashboard } from '@/components/FinancialDashboard';

const AdvancedFeatures = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Advanced Features
          </h1>
          <p className="text-muted-foreground mt-1">
            Inventory management, financial tracking, and communication tools
          </p>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="h-4 w-4 mr-2" />
              Communication
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-6">
            <InventoryManager />
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            <FinancialDashboard />
          </TabsContent>
          
          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Communication Hub</h3>
                  <p>Real-time messaging and notifications coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdvancedFeatures;