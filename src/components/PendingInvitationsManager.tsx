import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, RefreshCw, X, Search, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useClientInvitations, ClientInvitation } from '@/hooks/useClientInvitations';
import { formatDistanceToNow, format, isPast } from 'date-fns';

export const PendingInvitationsManager = () => {
  const { invitations, loading, fetchInvitations, resendInvitation, cancelInvitation } = useClientInvitations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const getStatusBadge = (invitation: ClientInvitation) => {
    const isExpired = isPast(new Date(invitation.expires_at));
    const status = isExpired && invitation.status === 'pending' ? 'expired' : invitation.status;

    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    if (isPast(expiry)) {
      return <span className="text-red-600">Expired</span>;
    }
    return (
      <span className="text-muted-foreground">
        Expires {formatDistanceToNow(expiry, { addSuffix: true })}
      </span>
    );
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    await resendInvitation(id);
    setResendingId(null);
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await cancelInvitation(id);
    setCancellingId(null);
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = 
      inv.invited_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: invitations.filter(i => i.status === 'pending' && !isPast(new Date(i.expires_at))).length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired' || (i.status === 'pending' && isPast(new Date(i.expires_at)))).length,
    cancelled: invitations.filter(i => i.status === 'cancelled').length
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Client Portal Invitations
            </CardTitle>
            <CardDescription>
              Track and manage client organization invitations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
            <div className="text-sm text-amber-600">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
            <div className="text-sm text-green-600">Accepted</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.expired}</div>
            <div className="text-sm text-red-600">Expired</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, client, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invitations found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvitations.map((invitation) => {
                const isExpired = isPast(new Date(invitation.expires_at));
                const canResend = invitation.status === 'pending' || invitation.status === 'expired' || isExpired;
                const canCancel = invitation.status === 'pending' && !isExpired;

                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.client?.name || '—'}
                    </TableCell>
                    <TableCell>{invitation.invited_email}</TableCell>
                    <TableCell>{invitation.organization?.name || '—'}</TableCell>
                    <TableCell>{getStatusBadge(invitation)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getTimeRemaining(invitation.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canResend && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation.id)}
                            disabled={resendingId === invitation.id}
                          >
                            {resendingId === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Resend
                              </>
                            )}
                          </Button>
                        )}
                        {canCancel && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={cancellingId === invitation.id}
                              >
                                {cancellingId === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will revoke the invitation sent to {invitation.invited_email}. 
                                  They will no longer be able to use the invitation link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancel(invitation.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Invitation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
