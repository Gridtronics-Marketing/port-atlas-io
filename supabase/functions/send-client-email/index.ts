import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  to: z.string().email(),
  cc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  clientId: z.string().uuid(),
  clientName: z.string().min(1).max(255),
  replyTo: z.string().email().optional(),
  sendCopy: z.boolean().optional().default(false),
  senderEmail: z.string().email().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, cc, subject, body, clientId, clientName, replyTo, sendCopy, senderEmail } = parsed.data;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build recipients
    const toRecipients = [to];
    const ccRecipients = [...cc];
    if (sendCopy && senderEmail && !toRecipients.includes(senderEmail) && !ccRecipients.includes(senderEmail)) {
      ccRecipients.push(senderEmail);
    }

    // Send via Resend
    const resendPayload: Record<string, unknown> = {
      from: `Atlas <outbound@runwithatlas.com>`,
      to: toRecipients,
      subject,
      html: body.replace(/\n/g, "<br>"),
      reply_to: replyTo || senderEmail || undefined,
    };
    if (ccRecipients.length > 0) {
      resendPayload.cc = ccRecipients;
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();
    const emailStatus = resendRes.ok ? "sent" : "failed";

    // Log to client_communications
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id || null;
    }

    await supabase.from("client_communications").insert({
      client_id: clientId,
      type: "email",
      direction: "outgoing",
      to_email: to,
      cc_emails: ccRecipients.length > 0 ? ccRecipients : null,
      subject,
      body,
      status: emailStatus,
      created_by: userId,
    });

    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
