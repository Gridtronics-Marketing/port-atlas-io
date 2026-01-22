import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  clientId: string;
  clientName: string;
  inviteEmail: string;
  userRole: 'admin' | 'member' | 'viewer';
  parentOrganizationId: string;
}

interface BulkInviteRequest {
  invitations: InviteRequest[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const body = await req.json();
    
    // Check if this is a bulk invite or single invite
    const isBulk = 'invitations' in body;
    const invitations: InviteRequest[] = isBulk ? body.invitations : [body];
    
    console.log(`Processing ${invitations.length} invitation(s)`);

    const results = [];

    for (const invitation of invitations) {
      try {
        const {
          clientId,
          clientName,
          inviteEmail,
          userRole,
          parentOrganizationId
        } = invitation;

        console.log(`Processing invitation for client: ${clientName}, email: ${inviteEmail}`);

        // Validate client exists and get its slug
        const { data: client, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('id, name, slug, organization_id')
          .eq('id', clientId)
          .single();

        if (clientError || !client) {
          console.error('Client not found:', clientError);
          results.push({
            clientId,
            success: false,
            error: 'Client not found',
            status: 'failed'
          });
          continue;
        }

        // Generate slug for client if it doesn't have one
        let clientSlug = client.slug;
        if (!clientSlug) {
          clientSlug = client.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          
          // Check for slug conflicts
          let finalSlug = clientSlug;
          let slugAttempt = 1;
          while (true) {
            const { data: slugCheck } = await supabaseAdmin
              .from('clients')
              .select('id')
              .eq('slug', finalSlug)
              .neq('id', clientId)
              .single();
            
            if (!slugCheck) break;
            finalSlug = `${clientSlug}-${slugAttempt}`;
            slugAttempt++;
            if (slugAttempt > 100) {
              finalSlug = `${clientSlug}-${Date.now()}`;
              break;
            }
          }
          
          // Update client with slug
          await supabaseAdmin
            .from('clients')
            .update({ slug: finalSlug })
            .eq('id', clientId);
          
          clientSlug = finalSlug;
          console.log('Generated slug for client:', clientSlug);
        }

        // Fetch branding settings to get app_domain
        const { data: brandingData } = await supabaseAdmin
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'email_branding')
          .single();

        const branding = brandingData?.setting_value as { app_domain?: string } || {};
        const appDomain = branding.app_domain || 'https://port-atlas-io.lovable.app';
        console.log('Using app domain for invite links:', appDomain);

        // Generate invite link using magiclink
        const { data: linkData, error: inviteLinkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: inviteEmail,
          options: {
            data: {
              client_id: clientId,
              client_name: clientName,
              organization_id: parentOrganizationId,
              portal_role: userRole
            },
            redirectTo: `${appDomain}/auth`
          }
        });

        if (inviteLinkError) {
          console.error('Error generating invite link:', inviteLinkError);
          results.push({
            clientId,
            success: false,
            error: `Failed to generate invitation: ${inviteLinkError.message}`,
            status: 'failed'
          });
          continue;
        }

        console.log('Generated invite link for:', inviteEmail);

        // Create invitation record
        const invitationToken = crypto.randomUUID();
        const { error: inviteRecordError } = await supabaseAdmin
          .from('client_invitations')
          .insert({
            client_id: clientId,
            organization_id: parentOrganizationId, // Parent org
            invited_email: inviteEmail,
            invited_by: user.id,
            status: 'pending',
            invitation_token: invitationToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            organization_id_scope: parentOrganizationId
          });

        if (inviteRecordError) {
          console.error('Error creating invitation record:', inviteRecordError);
        }

        // Create client_portal_users record (user will be linked when they accept)
        const { error: portalUserError } = await supabaseAdmin
          .from('client_portal_users')
          .insert({
            client_id: clientId,
            user_id: linkData.user.id,
            role: userRole,
            invited_by: user.id
          });

        if (portalUserError) {
          console.error('Error creating client portal user:', portalUserError);
        }

        // Get parent organization name for email
        const { data: parentOrg } = await supabaseAdmin
          .from('organizations')
          .select('name')
          .eq('id', parentOrganizationId)
          .single();

        // Send branded email
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-client-invitation-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              email: inviteEmail,
              clientName: clientName,
              organizationName: parentOrg?.name || 'Trade Atlas',
              inviteLink: linkData.properties.action_link,
              invitedByEmail: user.email,
              portalSlug: clientSlug
            })
          });

          if (!emailResponse.ok) {
            const emailError = await emailResponse.text();
            console.error('Error sending branded email:', emailError);
          } else {
            console.log('Invitation email sent successfully to:', inviteEmail);
          }
        } catch (emailError) {
          console.error('Error calling email function:', emailError);
        }

        results.push({
          clientId,
          success: true,
          clientSlug,
          status: 'invited'
        });
      } catch (error) {
        console.error(`Error processing invitation for client ${invitation.clientId}:`, error);
        results.push({
          clientId: invitation.clientId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Invitation processing complete. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        success: failureCount === 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in invite-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});