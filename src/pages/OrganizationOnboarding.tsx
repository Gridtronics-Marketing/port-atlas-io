import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import portAtlasLogo from "@/assets/port-atlas-logo-new.png";

const OrganizationOnboarding: React.FC = () => {
  const { user } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(e.target.value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.slug) return;

    setIsLoading(true);
    try {
      // Check if slug is already taken
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .maybeSingle();

      if (existingOrg) {
        toast.error('This organization URL is already taken. Please choose a different one.');
        setIsLoading(false);
        return;
      }

      // Create the organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as organization owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast.success('Organization created successfully!');
      
      // Refresh organizations list
      await refreshOrganizations();
      
      // Navigate to dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={portAtlasLogo} 
              alt="Port Atlas" 
              className="h-12 w-auto"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Create Your Organization
            </CardTitle>
            <CardDescription className="mt-2">
              Set up your company to start managing projects, teams, and locations.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="e.g., Acme Technologies"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">portatlas.app/</span>
                <Input
                  id="org-slug"
                  placeholder="acme-technologies"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be your unique organization identifier.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !formData.name || !formData.slug}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationOnboarding;
