import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublicOnboardingResponseRequest {
  lead_id: string;
  step_number: number;
  step_name: string;
  response_data: Record<string, unknown>;
  completed_at?: string | null;
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
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
    const body = (await req.json()) as Partial<PublicOnboardingResponseRequest>;

    const lead_id = cleanText(body.lead_id, 64);
    const step_name = cleanText(body.step_name, 64);
    const step_number = typeof body.step_number === "number" ? body.step_number : NaN;
    const response_data = typeof body.response_data === "object" && body.response_data ? body.response_data : null;

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!Number.isFinite(step_number) || step_number < 1 || step_number > 10) {
      return new Response(JSON.stringify({ error: "Invalid step_number" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!step_name) {
      return new Response(JSON.stringify({ error: "step_name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!response_data) {
      return new Response(JSON.stringify({ error: "response_data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabaseAdmin
      .from("onboarding_responses")
      .upsert(
        {
          lead_id,
          step_number,
          step_name,
          response_data,
          completed_at: body.completed_at ?? new Date().toISOString(),
        },
        { onConflict: "lead_id,step_number", ignoreDuplicates: false }
      );

    if (error) {
      console.error("public-onboarding-response upsert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save onboarding response" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("public-onboarding-response error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
