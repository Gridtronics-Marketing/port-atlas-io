import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, DollarSign, User, Edit } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { SignatureCapture } from '@/components/SignatureCapture';
import { format } from 'date-fns';

interface ContractDetailsModalProps {
  contractId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  contractId,
  open,
  onOpenChange,
}) => {
  const { contracts, signContract } = useContracts();
  const [showSignature, setShowSignature] = useState<'client' | 'company' | null>(null);
  
  const contract = contracts.find(c => c.id === contractId);

  if (!contract) {
    return null;
  }

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

  const handleSignature = async (signatureData: string, signerName: string, signerRole: string) => {
    if (!showSignature) return;
    
    try {
      await signContract(contract.id, signatureData, signerName, signerRole, showSignature);
      setShowSignature(null);
    } catch (error) {
      console.error('Error signing contract:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{contract.title}</DialogTitle>
            <Badge className={getStatusColor(contract.status)}>
              {contract.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Contract #{contract.contract_number}
          </p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contract Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-muted-foreground">{contract.contract_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.description || 'No description provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Billing Frequency</p>
                    <p className="text-sm text-muted-foreground">{contract.billing_frequency}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Contract Value</p>
                    <p className="text-2xl font-bold text-primary">
                      ${contract.contract_value.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(contract.start_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.end_date 
                          ? format(new Date(contract.end_date), 'MMM dd, yyyy')
                          : 'Ongoing'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {contract.terms_and_conditions ? (
                    <pre className="whitespace-pre-wrap text-sm">
                      {contract.terms_and_conditions}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No terms and conditions specified.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signatures" className="space-y-4">
            {showSignature ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {showSignature === 'client' ? 'Client Signature' : 'Company Signature'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignatureCapture
                    onSave={handleSignature}
                    title={`${showSignature === 'client' ? 'Client' : 'Company'} Signature`}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSignature(null)}
                    className="mt-4"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Client Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contract.signed_by_client ? (
                      <div>
                        <p className="text-sm font-medium">Signed by: {contract.signed_by_client}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.signed_date 
                            ? format(new Date(contract.signed_date), 'MMM dd, yyyy')
                            : 'Date not recorded'
                          }
                        </p>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Signed
                        </Badge>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Client signature required
                        </p>
                        <Button onClick={() => setShowSignature('client')}>
                          Sign as Client
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Company Signature
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contract.signed_by_company ? (
                      <div>
                        <p className="text-sm font-medium">Signed by: {contract.signed_by_company}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.signed_date 
                            ? format(new Date(contract.signed_date), 'MMM dd, yyyy')
                            : 'Date not recorded'
                          }
                        </p>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Signed
                        </Badge>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Company signature required
                        </p>
                        <Button onClick={() => setShowSignature('company')}>
                          Sign as Company
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Billing integration coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};