import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string;
  clientName: string;
  organizationName: string;
  inviteLink: string;
  invitedByEmail?: string;
  portalSlug?: string;
}

interface EmailBranding {
  logo_url: string | null;
  company_name: string;
  primary_color: string;
}

const defaultBranding: EmailBranding = {
  logo_url: null,
  company_name: 'Trade Atlas',
  primary_color: '#1e3a5f'
};

const getEmailTemplate = (data: EmailRequest, branding: EmailBranding): string => {
  const { clientName, organizationName, inviteLink, invitedByEmail, portalSlug } = data;
  
  const headerContent = branding.logo_url 
    ? `<img src="${branding.logo_url}" alt="${branding.company_name}" style="max-height: 60px; width: auto;" />`
    : `<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 1px;">${branding.company_name}</h1>`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to ${branding.company_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header with Dynamic Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, ${branding.primary_color} 0%, #2d5a87 100%); padding: 40px 40px 30px 40px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${headerContent}
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px; letter-spacing: 0.5px;">
                      Infrastructure Management Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Welcome Badge -->
          <tr>
            <td align="center" style="padding: 30px 40px 0 40px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 8px 24px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                You're Invited
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e3a5f; font-size: 24px; font-weight: 600; text-align: center;">
                Welcome to ${organizationName}
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                You've been invited to join <strong style="color: #1e3a5f;">${clientName}</strong> on ${branding.company_name}, 
                the comprehensive infrastructure management platform for network documentation, 
                work orders, and project tracking.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 40px 30px 40px;">
              <a href="${inviteLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, ${branding.primary_color} 0%, #2d5a87 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(30, 58, 95, 0.35); transition: all 0.3s ease;">
                Accept Invitation
              </a>
            </td>
          </tr>
          
          <!-- Info Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${invitedByEmail ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #64748b; font-size: 13px;">Invited by:</span>
                          <span style="color: #1e3a5f; font-size: 13px; font-weight: 500; margin-left: 8px;">${invitedByEmail}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #64748b; font-size: 13px;">Organization:</span>
                          <span style="color: #1e3a5f; font-size: 13px; font-weight: 500; margin-left: 8px;">${organizationName}</span>
                        </td>
                      </tr>
                      ${portalSlug ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #64748b; font-size: 13px;">Portal URL:</span>
                          <span style="color: ${branding.primary_color}; font-size: 13px; font-weight: 500; margin-left: 8px;">/p/${portalSlug}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td>
                          <span style="color: #f59e0b; font-size: 13px;">⏰ This invitation expires in 7 days</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What's Next Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h3 style="margin: 0 0 16px 0; color: #1e3a5f; font-size: 16px; font-weight: 600;">
                What happens next?
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="width: 24px; height: 24px; background: #dbeafe; border-radius: 50%; text-align: center; line-height: 24px; color: ${branding.primary_color}; font-size: 12px; font-weight: 600;">1</div>
                        </td>
                        <td style="color: #4b5563; font-size: 14px; line-height: 1.5; padding-left: 12px;">
                          Click "Accept Invitation" to set up your account
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="width: 24px; height: 24px; background: #dbeafe; border-radius: 50%; text-align: center; line-height: 24px; color: ${branding.primary_color}; font-size: 12px; font-weight: 600;">2</div>
                        </td>
                        <td style="color: #4b5563; font-size: 14px; line-height: 1.5; padding-left: 12px;">
                          Create a secure password for your account
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="width: 24px; height: 24px; background: #dbeafe; border-radius: 50%; text-align: center; line-height: 24px; color: ${branding.primary_color}; font-size: 12px; font-weight: 600;">3</div>
                        </td>
                        <td style="color: #4b5563; font-size: 14px; line-height: 1.5; padding-left: 12px;">
                          Access your client portal dashboard
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} ${branding.company_name}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Alternative Link -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 24px 40px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteLink}" style="color: ${branding.primary_color}; word-break: break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Database service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: EmailRequest = await req.json();
    const { email, clientName, organizationName, inviteLink, invitedByEmail, portalSlug } = body;

    if (!email || !clientName || !organizationName || !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, clientName, organizationName, inviteLink' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending invitation email to: ${email} for organization: ${organizationName}`);

    // Fetch branding settings from platform_settings
    let branding: EmailBranding = { ...defaultBranding };
    try {
      const { data: brandingData, error: brandingError } = await supabaseAdmin
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'email_branding')
        .single();

      if (!brandingError && brandingData?.setting_value) {
        const settingValue = brandingData.setting_value as EmailBranding;
        branding = {
          logo_url: settingValue.logo_url || defaultBranding.logo_url,
          company_name: settingValue.company_name || defaultBranding.company_name,
          primary_color: settingValue.primary_color || defaultBranding.primary_color
        };
      }
      console.log("Using branding:", branding);
    } catch (brandingFetchError) {
      console.warn("Could not fetch branding settings, using defaults:", brandingFetchError);
    }

    const htmlContent = getEmailTemplate(body, branding);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${branding.company_name} <onboarding@resend.dev>`,
        to: [email],
        subject: `You're invited to join ${organizationName} on ${branding.company_name}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});