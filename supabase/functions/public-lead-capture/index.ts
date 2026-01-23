import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LeadSource = "onboarding_wizard" | "contact_form" | "website";

interface PublicLeadCaptureRequest {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company_name?: string | null;
  industry?: string | null;
  company_size?: string | null;
  message?: string | null;
  source: LeadSource;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  notes?: string | null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanText(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  return v.slice(0, max);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as Partial<PublicLeadCaptureRequest>;

    const email = cleanText(body.email, 255);
    const first_name = cleanText(body.first_name, 100);
    const last_name = cleanText(body.last_name, 100);

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // In the product, first_name is often treated as required for lead capture.
    // Keep it required for onboarding + contact.
    const source = (body.source ?? "website") as LeadSource;
    if ((source === "onboarding_wizard" || source === "contact_form") && !first_name) {
      return new Response(JSON.stringify({ error: "first_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const allowedSources: LeadSource[] = ["onboarding_wizard", "contact_form", "website"];
    if (!allowedSources.includes(source)) {
      return new Response(JSON.stringify({ error: "Invalid source" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const insertPayload = {
      email,
      first_name,
      last_name,
      phone: cleanText(body.phone, 50),
      company_name: cleanText(body.company_name, 200),
      industry: cleanText(body.industry, 100),
      company_size: cleanText(body.company_size, 100),
      message: cleanText(body.message, 2000),
      source,
      utm_source: cleanText(body.utm_source, 100),
      utm_medium: cleanText(body.utm_medium, 100),
      utm_campaign: cleanText(body.utm_campaign, 100),
      utm_term: cleanText(body.utm_term, 100),
      utm_content: cleanText(body.utm_content, 100),
      status: "new",
      notes: cleanText(body.notes, 500),
      assigned_to: null,
    };

    const { data, error } = await supabaseAdmin
      .from("lead_captures")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("public-lead-capture insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to create lead" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("public-lead-capture error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
