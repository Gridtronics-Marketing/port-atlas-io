import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  serviceRequestId: string;
  eventType: "created" | "status_changed";
  newStatus?: string;
  previousStatus?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { serviceRequestId, eventType, newStatus, previousStatus }: NotifyRequest = await req.json();

    // Get the service request with related data
    const { data: serviceRequest, error: srError } = await supabase
      .from("service_requests")
      .select(`
        *,
        location:locations(name, address),
        requesting_organization:organizations!service_requests_requesting_organization_id_fkey(id, name),
        target_organization:organizations!service_requests_target_organization_id_fkey(id, name)
      `)
      .eq("id", serviceRequestId)
      .single();

    if (srError || !serviceRequest) {
      console.error("Error fetching service request:", srError);
      return new Response(JSON.stringify({ error: "Service request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications: any[] = [];

    if (eventType === "created") {
      // Notify parent organization staff (admins and project managers)
      const { data: orgMembers } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("organization_id", serviceRequest.target_organization_id)
        .in("role", ["admin", "project_manager", "owner"]);

      if (orgMembers) {
        for (const member of orgMembers) {
          notifications.push({
            user_id: member.user_id,
            organization_id: serviceRequest.target_organization_id,
            notification_type: "service_request",
            title: "New Service Request",
            message: `${serviceRequest.requesting_organization?.name || "A client"} submitted a new service request: "${serviceRequest.title}"`,
            data: { serviceRequestId, eventType, priority: serviceRequest.priority },
            service_request_id: serviceRequestId,
            is_read: false,
          });
        }
      }
    } else if (eventType === "status_changed") {
      // Notify the user who created the service request
      const { data: requestingOrgMembers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("organization_id", serviceRequest.requesting_organization_id);

      if (requestingOrgMembers) {
        const statusDisplay = {
          pending: "Pending",
          reviewed: "Under Review",
          approved: "Approved",
          rejected: "Rejected",
          in_progress: "In Progress",
          completed: "Completed",
        }[newStatus || ""] || newStatus;

        for (const member of requestingOrgMembers) {
          notifications.push({
            user_id: member.user_id,
            organization_id: serviceRequest.requesting_organization_id,
            notification_type: "service_request_update",
            title: "Service Request Updated",
            message: `Your service request "${serviceRequest.title}" has been updated to: ${statusDisplay}`,
            data: { serviceRequestId, eventType, newStatus, previousStatus },
            service_request_id: serviceRequestId,
            is_read: false,
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
      }
    }

    console.log(`Created ${notifications.length} notifications for ${eventType} event`);

    // Send email notifications
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        // Get user emails for notifications
        for (const notification of notifications) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", notification.user_id)
            .single();

          if (profile?.email) {
            // Check notification preferences
            const { data: prefs } = await supabase
              .from("notification_preferences")
              .select("email_on_new_request, email_on_status_change")
              .eq("user_id", notification.user_id)
              .single();

            const shouldSendEmail = eventType === "created"
              ? prefs?.email_on_new_request !== false
              : prefs?.email_on_status_change !== false;

            if (shouldSendEmail) {
              // Call the email edge function
              const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-service-request-email`;
              await fetch(emailFunctionUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  serviceRequestId,
                  eventType,
                  recipientEmail: profile.email,
                  recipientName: profile.full_name,
                  newStatus,
                }),
              });
            }
          }
        }
      } catch (emailError) {
        console.error("Error sending email notifications:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationCount: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-service-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
