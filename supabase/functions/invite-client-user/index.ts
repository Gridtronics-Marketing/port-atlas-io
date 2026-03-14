import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  clientId: string;
  clientName: string;
  inviteEmail: string;
  password: string;
  userName?: string;
  userRole: 'admin' | 'member' | 'viewer';
  parentOrganizationId: string;
}

interface BulkInviteRequest {
  invitations: InviteRequest[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const isBulk = 'invitations' in body;
    const invitations: InviteRequest[] = isBulk ? body.invitations : [body];

    console.log(`Processing ${invitations.length} invitation(s)`);

    const results = [];

    for (const invitation of invitations) {
      try {
        const { clientId, clientName, inviteEmail, password, userName, userRole, parentOrganizationId } = invitation;

        if (!password || password.length < 6) {
          results.push({ clientId, success: false, error: 'Password must be at least 6 characters', status: 'failed' });
          continue;
        }

        // Validate client exists and get slug
        const { data: client, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('id, name, slug, organization_id')
          .eq('id', clientId)
          .single();

        if (clientError || !client) {
          results.push({ clientId, success: false, error: 'Client not found', status: 'failed' });
          continue;
        }

        // Generate slug if needed
        let clientSlug = client.slug;
        if (!clientSlug) {
          clientSlug = client.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
          let finalSlug = clientSlug;
          let slugAttempt = 1;
          while (true) {
            const { data: slugCheck } = await supabaseAdmin.from('clients').select('id').eq('slug', finalSlug).neq('id', clientId).single();
            if (!slugCheck) break;
            finalSlug = `${clientSlug}-${slugAttempt}`;
            slugAttempt++;
            if (slugAttempt > 100) { finalSlug = `${clientSlug}-${Date.now()}`; break; }
          }
          await supabaseAdmin.from('clients').update({ slug: finalSlug }).eq('id', clientId);
          clientSlug = finalSlug;
        }

        // Create user with password directly — no email verification
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: inviteEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            client_id: clientId,
            client_name: clientName,
            organization_id: parentOrganizationId,
            portal_role: userRole
          }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          results.push({ clientId, success: false, error: createError.message, status: 'failed' });
          continue;
        }

        console.log('Created user:', userData.user.id);

        // Create invitation record
        const invitationToken = crypto.randomUUID();
        await supabaseAdmin.from('client_invitations').insert({
          client_id: clientId,
          organization_id: parentOrganizationId,
          invited_email: inviteEmail,
          invited_by: user.id,
          status: 'accepted',
          invitation_token: invitationToken,
          accepted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          organization_id_scope: parentOrganizationId
        });

        // Create client_portal_users record
        const { error: portalUserError } = await supabaseAdmin.from('client_portal_users').insert({
          client_id: clientId,
          user_id: userData.user.id,
          role: userRole,
          invited_by: user.id
        });

        if (portalUserError) {
          console.error('Error creating client portal user:', portalUserError);
        }

        results.push({ clientId, success: true, clientSlug, userId: userData.user.id, status: 'created' });
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

    return new Response(
      JSON.stringify({ success: failureCount === 0, results, summary: { total: results.length, success: successCount, failed: failureCount } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in invite-client-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
