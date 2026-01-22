import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Building2, LogIn, ArrowRight } from 'lucide-react';
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";
import tradeAtlasBackground from "@/assets/trade-atlas-background.jpg";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const PortalEntry = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { switchOrganization, organizations } = useOrganization();
  
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);

  // Fetch organization by slug
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgSlug) {
        setError('Invalid portal URL');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('id, name, slug, logo_url')
          .eq('slug', orgSlug)
          .single();

        if (fetchError || !data) {
          setError('Portal not found. Please check the URL and try again.');
          setLoading(false);
          return;
        }

        setOrganization(data);
      } catch (err) {
        setError('Failed to load portal');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgSlug]);

  // Check membership when user is authenticated
  useEffect(() => {
    const checkMembership = async () => {
      if (!user || !organization) return;

      setCheckingMembership(true);

      try {
        // Check if user is a member of this organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('id, role')
          .eq('organization_id', organization.id)
          .eq('user_id', user.id)
          .single();

        if (membership) {
          setIsMember(true);
          // Switch to this organization and redirect to dashboard
          await switchOrganization(organization.id);
          navigate('/', { replace: true });
        } else {
          setIsMember(false);
        }
      } catch (err) {
        setIsMember(false);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, [user, organization, switchOrganization, navigate]);

  // Store slug for post-login redirect
  const handleLogin = () => {
    sessionStorage.setItem('portal_redirect', orgSlug || '');
    navigate(`/auth?portal=${orgSlug}`);
  };

  // If still loading auth or org
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If error (org not found)
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
            <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <img 
                src={tradeAtlasLogo} 
                alt="Trade Atlas" 
                className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated but checking membership
  if (checkingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but not a member
  if (user && !isMember && organization) {
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
              {organization.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-16 w-auto" />
              ) : (
                <Building2 className="h-16 w-16 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl">{organization.name}</CardTitle>
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
            <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <img 
                src={tradeAtlasLogo} 
                alt="Trade Atlas" 
                className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
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
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-16 w-auto" />
            ) : (
              <img src={tradeAtlasLogo} alt="Trade Atlas" className="h-16 w-auto" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {organization?.name || 'Client Portal'}
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
          <div className="pt-4 border-t border-border/50 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Powered by</span>
            <img 
              src={tradeAtlasLogo} 
              alt="Trade Atlas" 
              className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalEntry;
