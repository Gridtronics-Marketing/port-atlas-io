import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  lead_id: string;
  notification_type: "contact_form" | "onboarding_complete";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id, notification_type }: LeadNotificationRequest = await req.json();

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the lead details
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("lead_captures")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error(`Failed to fetch lead: ${leadError?.message || "Lead not found"}`);
    }

    // Fetch super admin emails from platform_admins
    const { data: admins, error: adminError } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("role", "super_admin");

    if (adminError) {
      console.error("Failed to fetch admins:", adminError);
      throw new Error("Failed to fetch admin list");
    }

    if (!admins || admins.length === 0) {
      console.log("No super admins found to notify");
      return new Response(
        JSON.stringify({ message: "No super admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from profiles
    const adminUserIds = admins.map((a) => a.user_id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("id", adminUserIds);

    if (profileError || !profiles || profiles.length === 0) {
      console.error("Failed to fetch admin profiles:", profileError);
      throw new Error("Failed to fetch admin emails");
    }

    const adminEmails = profiles.map((p) => p.email).filter(Boolean);

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Compose email based on notification type
    const isOnboarding = notification_type === "onboarding_complete";
    const subject = isOnboarding
      ? `🎉 New Lead Completed Onboarding: ${lead.first_name || "Unknown"} ${lead.last_name || ""}`
      : `📬 New Contact Form Submission: ${lead.first_name || "Unknown"} ${lead.last_name || ""}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center; }
          .header h1 { color: #d4a853; margin: 0; font-size: 24px; }
          .header p { color: #888; margin: 10px 0 0; font-size: 14px; }
          .content { padding: 30px; }
          .badge { display: inline-block; background: ${isOnboarding ? "#22c55e" : "#3b82f6"}; color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
          .field { margin-bottom: 16px; }
          .field-label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .field-value { color: #1a1a2e; font-size: 16px; font-weight: 500; }
          .cta { text-align: center; padding: 20px 30px 30px; }
          .cta a { display: inline-block; background: #d4a853; color: #1a1a2e; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trade Atlas</h1>
            <p>New Lead Notification</p>
          </div>
          <div class="content">
            <span class="badge">${isOnboarding ? "✓ Onboarding Complete" : "📩 Contact Form"}</span>
            
            <div class="field">
              <div class="field-label">Name</div>
              <div class="field-value">${lead.first_name || "—"} ${lead.last_name || ""}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value">${lead.email || "—"}</div>
            </div>
            
            ${lead.phone ? `
            <div class="field">
              <div class="field-label">Phone</div>
              <div class="field-value">${lead.phone}</div>
            </div>
            ` : ""}
            
            ${lead.company_name ? `
            <div class="field">
              <div class="field-label">Company</div>
              <div class="field-value">${lead.company_name}</div>
            </div>
            ` : ""}
            
            ${lead.industry ? `
            <div class="field">
              <div class="field-label">Industry</div>
              <div class="field-value">${lead.industry}</div>
            </div>
            ` : ""}
            
            ${lead.company_size ? `
            <div class="field">
              <div class="field-label">Company Size</div>
              <div class="field-value">${lead.company_size}</div>
            </div>
            ` : ""}
            
            ${lead.message ? `
            <div class="field">
              <div class="field-label">Message</div>
              <div class="field-value">${lead.message}</div>
            </div>
            ` : ""}
            
            ${lead.source ? `
            <div class="field">
              <div class="field-label">Source</div>
              <div class="field-value">${lead.source}</div>
            </div>
            ` : ""}
          </div>
          <div class="cta">
            <a href="https://port-atlas-io.lovable.app/admin/platform">View in Dashboard →</a>
          </div>
          <div class="footer">
            This is an automated notification from Trade Atlas.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all super admins
    const emailResponse = await resend.emails.send({
      from: "Trade Atlas <onboarding@resend.dev>",
      to: adminEmails,
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update lead status if it was from contact form
    if (notification_type === "contact_form") {
      await supabaseAdmin
        .from("lead_captures")
        .update({ status: "new" })
        .eq("id", lead_id);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-lead function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
