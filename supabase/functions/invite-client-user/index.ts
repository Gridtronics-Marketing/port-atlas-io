import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  clientId: string;
  clientName: string;
  organizationName: string;
  organizationSlug: string;
  inviteEmail: string;
  userRole: 'owner' | 'admin' | 'member' | 'viewer';
  parentOrganizationId: string;
  existingOrganizationId?: string; // For adding users to existing portals
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
          organizationName,
          organizationSlug,
          inviteEmail,
          userRole,
          parentOrganizationId,
          existingOrganizationId
        } = invitation;

        console.log(`Processing invitation for client: ${clientName}, email: ${inviteEmail}`);

        // Check for existing organization - EITHER passed directly OR linked to client
        let targetOrganizationId = existingOrganizationId;
        let targetOrganizationName = organizationName;
        let targetOrganizationSlug = organizationSlug;

        if (!targetOrganizationId && clientId) {
          const { data: existingClient } = await supabaseAdmin
            .from('clients')
            .select('linked_organization_id, linked_organization:organizations(id, name, slug)')
            .eq('id', clientId)
            .single();

          if (existingClient?.linked_organization_id) {
            targetOrganizationId = existingClient.linked_organization_id;
            const linkedOrg = existingClient.linked_organization as any;
            if (linkedOrg) {
              targetOrganizationName = linkedOrg.name || organizationName;
              targetOrganizationSlug = linkedOrg.slug || organizationSlug;
            }
            console.log('Found existing organization for client:', targetOrganizationId);
          }
        }

        const origin = req.headers.get('origin') || 'https://trade-atlas.lovable.app';

        if (targetOrganizationId) {
          // === PATH 1: ADD USER TO EXISTING ORGANIZATION ===
          console.log(`Adding user ${inviteEmail} to existing organization ${targetOrganizationId}`);

          // Generate invite link
          const { data: linkData, error: inviteLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: inviteEmail,
            options: {
              data: {
                organization_id: targetOrganizationId,
                organization_name: targetOrganizationName,
                role: userRole
              },
              redirectTo: `${origin}/auth`
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
              organization_id: targetOrganizationId,
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

          // Create organization member record
          const { error: memberError } = await supabaseAdmin
            .from('organization_members')
            .insert({
              organization_id: targetOrganizationId,
              user_id: linkData.user.id,
              role: userRole
            });

          if (memberError) {
            console.error('Error creating organization member:', memberError);
          }

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
                clientName: clientName || targetOrganizationName,
                organizationName: targetOrganizationName,
                inviteLink: linkData.properties.action_link,
                invitedByEmail: user.email,
                portalSlug: targetOrganizationSlug
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
            organizationId: targetOrganizationId,
            status: 'invited'
          });
          continue;
        }

        // === PATH 2: CREATE NEW ORGANIZATION ===
        console.log('Creating new organization for client:', clientName);

        // Create the organization
        const { data: newOrg, error: orgError } = await supabaseAdmin
          .from('organizations')
          .insert({
            name: organizationName,
            slug: organizationSlug,
            owner_id: user.id, // Parent company admin owns it initially
            settings: {
              branding: {
                primaryColor: '#3B82F6',
                secondaryColor: '#1E40AF',
                logoUrl: null
              },
              parentOrganizationId: parentOrganizationId
            }
          })
          .select()
          .single();

        if (orgError) {
          console.error('Error creating organization:', orgError);
          results.push({
            clientId,
            success: false,
            error: `Failed to create organization: ${orgError.message}`,
            status: 'failed'
          });
          continue;
        }

        console.log('Created organization:', newOrg.id);

        // Link organization to client
        const { error: linkError } = await supabaseAdmin
          .from('clients')
          .update({ linked_organization_id: newOrg.id })
          .eq('id', clientId);

        if (linkError) {
          console.error('Error linking organization to client:', linkError);
        }

        // Generate invitation token
        const invitationToken = crypto.randomUUID();

        // Create invitation record
        const { data: invitationRecord, error: inviteRecordError } = await supabaseAdmin
          .from('client_invitations')
          .insert({
            client_id: clientId,
            organization_id: newOrg.id,
            invited_email: inviteEmail,
            invited_by: user.id,
            status: 'pending',
            invitation_token: invitationToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            organization_id_scope: parentOrganizationId
          })
          .select()
          .single();

        if (inviteRecordError) {
          console.error('Error creating invitation record:', inviteRecordError);
        }

        // Generate invite link WITHOUT sending Supabase's default email
        const { data: linkData, error: inviteLinkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: inviteEmail,
          options: {
            data: {
              organization_id: newOrg.id,
              organization_name: organizationName,
              role: userRole,
              invitation_token: invitationToken
            },
            redirectTo: `${origin}/auth`
          }
        });

        if (inviteLinkError) {
          console.error('Error generating invite link:', inviteLinkError);
          
          // Clean up: delete the organization if invite fails
          await supabaseAdmin.from('organizations').delete().eq('id', newOrg.id);
          await supabaseAdmin.from('clients').update({ linked_organization_id: null }).eq('id', clientId);
          
          results.push({
            clientId,
            success: false,
            error: `Failed to generate invitation: ${inviteLinkError.message}`,
            status: 'failed'
          });
          continue;
        }

        console.log('Generated invite link for:', inviteEmail);

        // Send branded Trade Atlas invitation email via Resend
        const inviteLink = linkData.properties.action_link;
        
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-client-invitation-email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              email: inviteEmail,
              clientName,
              organizationName,
              inviteLink,
              invitedByEmail: user.email,
              portalSlug: organizationSlug
            })
          });

          if (!emailResponse.ok) {
            const emailError = await emailResponse.json();
            console.error('Error sending branded email:', emailError);
            // Continue anyway - user was created, just email failed
          } else {
            console.log('Branded invitation email sent successfully to:', inviteEmail);
          }
        } catch (emailError) {
          console.error('Error calling email function:', emailError);
          // Continue anyway - user was created
        }

        // Store invite data for member creation
        const inviteData = { user: linkData.user };

        console.log('Invitation sent successfully to:', inviteEmail);

        // Pre-create organization member record (will be activated on signup)
        const { error: memberError } = await supabaseAdmin
          .from('organization_members')
          .insert({
            organization_id: newOrg.id,
            user_id: inviteData.user.id,
            role: userRole
          });

        if (memberError) {
          console.error('Error creating organization member:', memberError);
        }

        results.push({
          clientId,
          success: true,
          organizationId: newOrg.id,
          invitationId: invitationRecord?.id,
          status: 'invited'
        });

      } catch (error) {
        console.error('Error processing invitation:', error);
        results.push({
          clientId: invitation.clientId,
          success: false,
          error: error.message,
          status: 'failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success && r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    console.log(`Completed: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});