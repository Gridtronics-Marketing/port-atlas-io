import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Mail, Users, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';

interface BulkClientInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSuccess?: () => void;
}

interface InviteResult {
  clientId: string;
  clientName: string;
  email: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error?: string;
}

export const BulkClientInviteModal = ({
  open,
  onOpenChange,
  clients,
  onSuccess
}: BulkClientInviteModalProps) => {
  const { currentOrganization } = useOrganization();
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [progress, setProgress] = useState(0);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Categorize clients (linked_organization_id may not be on type yet)
  const validClients = clients.filter(c => c.contact_email && !(c as any).linked_organization_id);
  const noEmailClients = clients.filter(c => !c.contact_email);
  const alreadyInvitedClients = clients.filter(c => (c as any).linked_organization_id);

  const handleBulkInvite = async () => {
    if (!currentOrganization?.id) {
      toast.error('No organization context found');
      return;
    }

    setProcessing(true);
    setProgress(0);
    
    // Initialize results
    const initialResults: InviteResult[] = clients.map(c => ({
      clientId: c.id,
      clientName: c.name,
      email: c.contact_email || '',
      status: !c.contact_email ? 'skipped' : (c as any).linked_organization_id ? 'skipped' : 'pending',
      error: !c.contact_email ? 'No email address' : (c as any).linked_organization_id ? 'Already has portal' : undefined
    }));
    setResults(initialResults);

    try {
      // Build invitation requests for valid clients
      const invitations = validClients.map(client => ({
        clientId: client.id,
        clientName: client.name,
        organizationName: client.name,
        organizationSlug: generateSlug(client.name),
        inviteEmail: client.contact_email!,
        userRole: 'admin' as const,
        parentOrganizationId: currentOrganization.id
      }));

      if (invitations.length === 0) {
        toast.warning('No valid clients to invite');
        setCompleted(true);
        setProcessing(false);
        return;
      }

      // Send bulk invite request
      const response = await supabase.functions.invoke('invite-client-user', {
        body: { invitations }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Bulk invite failed');
      }

      const data = response.data;

      // Update results based on response
      const updatedResults = initialResults.map(result => {
        if (result.status === 'skipped') return result;

        const apiResult = data.results?.find((r: any) => r.clientId === result.clientId);
        if (apiResult) {
          return {
            ...result,
            status: apiResult.success ? 'success' : 'failed',
            error: apiResult.error
          } as InviteResult;
        }
        return result;
      });

      setResults(updatedResults);
      setProgress(100);
      setCompleted(true);

      const successCount = updatedResults.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} invitation(s)`);
        onSuccess?.();
      }

    } catch (error: any) {
      console.error('Bulk invite error:', error);
      toast.error(error.message || 'Failed to send invitations');
      
      // Mark all pending as failed
      setResults(prev => prev.map(r => 
        r.status === 'pending' ? { ...r, status: 'failed', error: error.message } as InviteResult : r
      ));
      setCompleted(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setCompleted(false);
      setResults([]);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: InviteResult['status']) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: InviteResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Invited</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Create Portal Access
          </DialogTitle>
          <DialogDescription>
            Create organizations and send login invitations to {clients.length} selected client(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {!completed && !processing && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{validClients.length}</div>
                    <div className="text-sm text-green-600">Ready to invite</div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{noEmailClients.length}</div>
                    <div className="text-sm text-amber-600">Missing email</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-700">{alreadyInvitedClients.length}</div>
                    <div className="text-sm text-gray-600">Already have portal</div>
                  </CardContent>
                </Card>
              </div>

              {/* Client List Preview */}
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                  {clients.map(client => {
                      const hasEmail = !!client.contact_email;
                      const hasPortal = !!(client as any).linked_organization_id;
                      const isValid = hasEmail && !hasPortal;

                    return (
                      <div
                        key={client.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isValid ? 'bg-green-50/50 border-green-200' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className={`h-5 w-5 ${isValid ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.contact_email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isValid ? (
                            <Badge className="bg-green-100 text-green-800">Ready</Badge>
                          ) : hasPortal ? (
                            <Badge variant="secondary">Has Portal</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600">No Email</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Processing/Completed State */}
          {(processing || completed) && (
            <>
              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sending invitations...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                  {results.map(result => (
                    <div
                      key={result.clientId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.email || 'No email'}
                            {result.error && (
                              <span className="text-red-600 ml-2">— {result.error}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {completed && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div>
                      <div className="font-bold text-green-600">
                        {results.filter(r => r.status === 'success').length}
                      </div>
                      <div className="text-muted-foreground">Invited</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">
                        {results.filter(r => r.status === 'failed').length}
                      </div>
                      <div className="text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-600">
                        {results.filter(r => r.status === 'skipped').length}
                      </div>
                      <div className="text-muted-foreground">Skipped</div>
                    </div>
                    <div>
                      <div className="font-bold">{results.length}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            {completed ? 'Close' : 'Cancel'}
          </Button>
          {!completed && (
            <Button 
              onClick={handleBulkInvite} 
              disabled={processing || validClients.length === 0}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send {validClients.length} Invitation{validClients.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
