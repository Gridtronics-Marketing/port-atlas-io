import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Building2, LogIn, ArrowRight } from 'lucide-react';
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";
import tradeAtlasBackground from "@/assets/trade-atlas-background.jpg";
import { APP_VERSION } from '@/lib/version';

interface ClientPortal {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
  organization?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

const PortalEntry = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { switchOrganization } = useOrganization();
  
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientPortal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Fetch client by slug (now using clients table, not organizations)
  useEffect(() => {
    const fetchClient = async () => {
      if (!orgSlug) {
        setError('Invalid portal URL');
        setLoading(false);
        return;
      }

      try {
        const { data: clientData, error: fetchError } = await supabase
          .from('clients')
          .select('id, name, organization_id')
          .eq('slug', orgSlug)
          .maybeSingle();

        if (fetchError || !clientData) {
          setError('Portal not found. Please check the URL and try again.');
          setLoading(false);
          return;
        }

        const typedData = clientData as unknown as { id: string; name: string; organization_id: string };

        // Fetch organization details separately
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', typedData.organization_id)
          .single();

        setClient({
          id: typedData.id,
          name: typedData.name,
          slug: orgSlug,
          organization_id: typedData.organization_id,
          organization: orgData || undefined
        });
      } catch (err) {
        setError('Failed to load portal');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [orgSlug]);

  // Check access when user is authenticated
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !client) return;

      setCheckingAccess(true);

      try {
        // Check if user has access to this client via client_portal_users
        const { data: portalUser } = await supabase
          .from('client_portal_users')
          .select('id, role')
          .eq('client_id', client.id)
          .eq('user_id', user.id)
          .single();

        if (portalUser) {
          setHasAccess(true);
          // Switch to the parent organization and redirect to client portal dashboard
          await switchOrganization(client.organization_id);
          navigate('/client-portal', { replace: true });
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, client, switchOrganization, navigate]);

  // Store slug for post-login redirect
  const handleLogin = () => {
    sessionStorage.setItem('portal_redirect', orgSlug || '');
    navigate(`/auth?portal=${orgSlug}`);
  };

  // If still loading auth or client
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If error (client not found)
  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={tradeAtlasBackground}
          alt=""
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <Card className="w-full max-w-md shadow-medium backdrop-blur-md bg-card/95 relative" style={{ zIndex: 10 }}>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={tradeAtlasLogo} alt="Trade Atlas" className="h-16 w-auto" />
            </div>
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl">Portal Not Found</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Button onClick={() => navigate('/auth')} variant="outline">
              Go to Login
            </Button>
            <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <img 
                  src={tradeAtlasLogo} 
                  alt="Trade Atlas" 
                  className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated but checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but doesn't have access
  if (user && !hasAccess && client) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={tradeAtlasBackground}
          alt=""
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        <Card className="w-full max-w-md shadow-medium backdrop-blur-md bg-card/95 relative" style={{ zIndex: 10 }}>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {client.organization?.logo_url ? (
                <img src={client.organization.logo_url} alt={client.name} className="h-16 w-auto" />
              ) : (
                <Building2 className="h-16 w-16 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl">{client.name}</CardTitle>
            <CardDescription>
              You don't have access to this portal. Please contact the administrator to request access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Logged in as: <strong>{user.email}</strong>
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
              <Button variant="ghost" onClick={handleLogin}>
                Login with Different Account
              </Button>
            </div>
            <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <img 
                  src={tradeAtlasLogo} 
                  alt="Trade Atlas" 
                  className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not authenticated, show portal welcome page
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <img 
        src={tradeAtlasBackground}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <Card className="w-full max-w-md shadow-medium backdrop-blur-md bg-card/95 relative" style={{ zIndex: 10 }}>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {client?.organization?.logo_url ? (
              <img src={client.organization.logo_url} alt={client.name} className="h-16 w-auto" />
            ) : (
              <img src={tradeAtlasLogo} alt="Trade Atlas" className="h-16 w-auto" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {client?.name || 'Client Portal'}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Building2 className="h-4 w-4 text-primary" />
              Trade Atlas Client Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Sign in to access your client portal and view your locations, work orders, and service requests.
          </p>
          <Button 
            onClick={handleLogin} 
            className="w-full bg-gradient-primary hover:bg-primary-hover"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In to Portal
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
            <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by</span>
                <img 
                  src={tradeAtlasLogo} 
                  alt="Trade Atlas" 
                  className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalEntry;