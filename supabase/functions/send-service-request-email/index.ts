import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  serviceRequestId: string;
  eventType: "created" | "status_changed";
  recipientEmail: string;
  recipientName?: string;
  newStatus?: string;
  previousStatus?: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  under_review: "Under Review",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

const priorityLabels: Record<string, string> = {
  urgent: "🔴 Urgent",
  high: "🟠 High",
  medium: "🟡 Medium",
  low: "🟢 Low",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      serviceRequestId,
      eventType,
      recipientEmail,
      recipientName,
      newStatus,
    }: EmailRequest = await req.json();

    // Fetch service request details
    const { data: request, error: requestError } = await supabase
      .from("service_requests")
      .select(`
        *,
        location:locations(name),
        requesting_organization:organizations!service_requests_requesting_organization_id_fkey(name),
        parent_organization:organizations!service_requests_parent_organization_id_fkey(name)
      `)
      .eq("id", serviceRequestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching service request:", requestError);
      return new Response(
        JSON.stringify({ error: "Service request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (eventType === "created") {
      // New request notification (sent to parent org staff)
      subject = `New Service Request from ${request.requesting_organization?.name || "Client"}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .detail-row { display: flex; margin-bottom: 12px; }
            .detail-label { font-weight: 600; width: 120px; color: #6b7280; }
            .detail-value { flex: 1; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; }
            .description-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 16px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New Service Request</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">A new request has been submitted</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; color: #1f2937;">${request.title}</h2>
              
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${priorityLabels[request.priority] || request.priority}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value" style="text-transform: capitalize;">${request.request_type}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Client:</span>
                <span class="detail-value">${request.requesting_organization?.name || "Unknown"}</span>
              </div>
              
              ${request.location?.name ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${request.location.name}</span>
              </div>
              ` : ""}
              
              ${request.description ? `
              <div class="description-box">
                <strong style="display: block; margin-bottom: 8px; color: #374151;">Description:</strong>
                <p style="margin: 0; white-space: pre-wrap;">${request.description}</p>
              </div>
              ` : ""}
              
              <div class="footer">
                <p>Log in to review and respond to this request.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Status update notification (sent to client)
      const statusLabel = statusLabels[newStatus || request.status] || request.status;
      subject = `Your Service Request Has Been Updated - ${statusLabel}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-size: 16px; font-weight: 600; background: #dbeafe; color: #1e40af; }
            .notes-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 16px; }
            .work-order-box { background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #f59e0b; margin-top: 16px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Request Update</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Your service request has been updated</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; color: #1f2937;">${request.title}</h2>
              
              <p style="margin-bottom: 16px;">
                <strong>New Status:</strong><br>
                <span class="status-badge">${statusLabel}</span>
              </p>
              
              ${request.review_notes ? `
              <div class="notes-box">
                <strong style="display: block; margin-bottom: 8px; color: #374151;">Response from our team:</strong>
                <p style="margin: 0; white-space: pre-wrap;">${request.review_notes}</p>
              </div>
              ` : ""}
              
              ${request.work_order_id ? `
              <div class="work-order-box">
                <strong style="color: #92400e;">✓ Work Order Created</strong>
                <p style="margin: 8px 0 0 0; color: #78350f;">A work order has been created to address your request. Our team will be working on it soon.</p>
              </div>
              ` : ""}
              
              <div class="footer">
                <p>Thank you for using our service request system.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Service Requests <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-service-request-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
