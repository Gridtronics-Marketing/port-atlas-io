import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Mail, Loader2, AlertCircle, UserPlus, Key, RefreshCw, Copy, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/hooks/useClients';

interface CreateClientPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess?: () => void;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const segments = [4, 4, 4];
  return segments.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
};

interface CreatedCredentials {
  name: string;
  email: string;
  password: string;
}

export const CreateClientPortalModal = ({
  open, onOpenChange, client, onSuccess
}: CreateClientPortalModalProps) => {
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(client.contact_email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const [hasPortalUsers, setHasPortalUsers] = useState(false);
  const [checkingPortalUsers, setCheckingPortalUsers] = useState(true);

  useEffect(() => {
    const checkPortalUsers = async () => {
      if (!open || !client.id) return;
      setCheckingPortalUsers(true);
      const { data, error } = await supabase
        .from('client_portal_users')
        .select('id')
        .eq('client_id', client.id)
        .limit(1);
      setHasPortalUsers(!error && data && data.length > 0);
      setCheckingPortalUsers(false);
    };
    checkPortalUsers();
  }, [open, client.id]);

  useEffect(() => {
    if (open) {
      setUserName(client.contact_name || '');
      setInviteEmail(client.contact_email || '');
      setPassword('');
      setCreatedCredentials(null);
      setCopied(false);
    }
  }, [open, client]);

  const handleCopyCredentials = async () => {
  if (!createdCredentials) return;
    const text = `Name: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async () => {
    if (!inviteEmail) { toast.error('Email address is required'); return; }
    if (!password || password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    const parentOrgId = client.organization_id;
    if (!parentOrgId) { toast.error('Client has no organization assigned'); return; }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('invite-client-user', {
        body: {
          clientId: client.id,
          clientName: client.name,
          inviteEmail,
          password,
          userName,
          userRole: 'admin',
          parentOrganizationId: parentOrgId
        }
      });

      if (response.error) throw new Error(response.error.message || 'Failed to create account');

      const result = response.data;
      if (!result.success || result.results[0]?.status === 'failed') {
        throw new Error(result.results[0]?.error || 'Failed to create account');
      }

      setCreatedCredentials({ name: userName, email: inviteEmail, password });
      toast.success('Account created successfully');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // After creation, show credential card
  if (createdCredentials) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Account Created
            </DialogTitle>
            <DialogDescription>
              Share these credentials with the client so they can sign in.
            </DialogDescription>
          </DialogHeader>
          <Card className="border-accent bg-accent/10">
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-mono text-sm">{createdCredentials.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-sm">{createdCredentials.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <p className="font-mono text-sm">{createdCredentials.password}</p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCopyCredentials}>
              {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasPortalUsers ? <UserPlus className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            {hasPortalUsers ? 'Add Portal User' : 'Create Portal Access'}
          </DialogTitle>
          <DialogDescription>
            Create a login account for {client.name}. Share the credentials after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Client user's name" className="pl-10" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="client@example.com" className="pl-10" />
            </div>
            {!client.contact_email && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> No contact email on file.
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => { setPassword(generatePassword()); setShowPassword(true); }} title="Generate password">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !inviteEmail || !password || password.length < 6 || checkingPortalUsers}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : <><UserPlus className="h-4 w-4 mr-2" />Create Account</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
