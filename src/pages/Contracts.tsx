import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, FileText, DollarSign, Calendar, Search, TrendingUp } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { AddContractModal } from '@/components/AddContractModal';
import { ContractDetailsModal } from '@/components/ContractDetailsModal';
import { ServicePlanModal } from '@/components/ServicePlanModal';

export default function Contracts() {
  const { contracts, servicePlans, loading, getRevenueMetrics } = useContracts();
  const [showAddContract, setShowAddContract] = useState(false);
  const [showServicePlan, setShowServicePlan] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);

  React.useEffect(() => {
    const loadMetrics = async () => {
      const metrics = await getRevenueMetrics();
      setRevenueMetrics(metrics);
    };
    if (!loading) {
      loadMetrics();
    }
  }, [loading, contracts]);

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading contracts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contracts & Revenue</h1>
          <p className="text-muted-foreground">
            Manage service contracts and track recurring revenue
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button onClick={() => setShowServicePlan(true)} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Service Plans
          </Button>
          <Button onClick={() => setShowAddContract(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      {revenueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueMetrics.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                {revenueMetrics.activeContracts} active contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueMetrics.mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueMetrics.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueMetrics.averageContractValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per contract</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="active">Active ({contracts.filter(c => c.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({contracts.filter(c => c.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({contracts.filter(c => c.status === 'pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredContracts.map((contract) => (
              <Card 
                key={contract.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedContract(contract.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{contract.title}</h3>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Contract #{contract.contract_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contract.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${contract.contract_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contract.billing_frequency}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {contract.start_date} - {contract.end_date || 'Ongoing'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {filteredContracts.filter(c => c.status === 'active').map((contract) => (
              <Card 
                key={contract.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedContract(contract.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Contract #{contract.contract_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${contract.contract_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contract.billing_frequency}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <div className="grid gap-4">
            {filteredContracts.filter(c => c.status === 'draft').map((contract) => (
              <Card 
                key={contract.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedContract(contract.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Contract #{contract.contract_number}
                      </p>
                    </div>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {filteredContracts.filter(c => c.status === 'pending').map((contract) => (
              <Card 
                key={contract.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedContract(contract.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Contract #{contract.contract_number}
                      </p>
                    </div>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddContractModal 
        open={showAddContract} 
        onOpenChange={setShowAddContract}
      />
      
      <ServicePlanModal 
        open={showServicePlan} 
        onOpenChange={setShowServicePlan}
      />

      {selectedContract && (
        <ContractDetailsModal
          contractId={selectedContract}
          open={!!selectedContract}
          onOpenChange={(open) => !open && setSelectedContract(null)}
        />
      )}
    </div>
  );
}