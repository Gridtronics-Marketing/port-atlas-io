import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a secure encryption key from the service role key
async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.substring(0, 32)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("integration-credentials-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptCredentials(credentials: Record<string, string>): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(credentials))
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptCredentials(encryptedData: string): Promise<Record<string, string>> {
  const key = await getEncryptionKey();
  
  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData).split("").map((c) => c.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return "****";
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}

interface RequestBody {
  action: "configure" | "test" | "deactivate" | "get_status";
  integration_type: "twilio" | "openphone";
  organization_id: string;
  credentials?: {
    account_sid?: string;
    auth_token?: string;
    phone_number?: string;
    api_key?: string;
  };
  settings?: Record<string, boolean>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    const { action, integration_type, organization_id, credentials, settings } = body;

    // Verify user has admin access to this organization
    const { data: orgRole } = await adminClient.rpc("get_user_org_role", {
      _user_id: userId,
      _org_id: organization_id,
    });

    const { data: isSuperAdmin } = await adminClient.rpc("is_super_admin", {
      _user_id: userId,
    });

    if (!isSuperAdmin && !["owner", "admin"].includes(orgRole || "")) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const projectRef = "mhrekppksiekhstnteyu";
    const baseWebhookUrl = `https://${projectRef}.supabase.co/functions/v1`;

    switch (action) {
      case "get_status": {
        const { data: existing } = await adminClient
          .from("integration_credentials")
          .select("id, integration_type, phone_number, is_active, last_verified_at, last_error, settings")
          .eq("organization_id", organization_id)
          .eq("integration_type", integration_type)
          .single();

        return new Response(
          JSON.stringify({
            configured: !!existing?.id,
            is_active: existing?.is_active || false,
            phone_number_masked: existing?.phone_number ? maskPhoneNumber(existing.phone_number) : null,
            last_verified_at: existing?.last_verified_at,
            last_error: existing?.last_error,
            settings: existing?.settings || {},
            webhook_url: integration_type === "openphone" 
              ? `${baseWebhookUrl}/openphone-webhook`
              : null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      case "configure": {
        if (!credentials) {
          return new Response(JSON.stringify({ error: "Credentials required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Encrypt credentials before storage
        const encryptedCreds = await encryptCredentials(credentials);
        const webhookSecret = generateWebhookSecret();
        const phoneNumber = credentials.phone_number || "";

        // Upsert integration credentials
        const { data: saved, error: saveError } = await adminClient
          .from("integration_credentials")
          .upsert({
            organization_id,
            integration_type,
            encrypted_credentials: encryptedCreds,
            webhook_secret: webhookSecret,
            phone_number: phoneNumber,
            is_active: false, // Require explicit activation after test
            settings: settings || {},
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "organization_id,integration_type",
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving credentials:", saveError);
          return new Response(JSON.stringify({ error: "Failed to save credentials" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Update phone number mapping for webhook routing
        if (phoneNumber) {
          await adminClient.from("phone_number_org_mapping").upsert({
            phone_number: phoneNumber,
            organization_id,
            integration_type,
            is_active: true,
          }, {
            onConflict: "phone_number,integration_type",
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            configured: true,
            phone_number_masked: maskPhoneNumber(phoneNumber),
            webhook_url: integration_type === "openphone"
              ? `${baseWebhookUrl}/openphone-webhook`
              : null,
            webhook_secret: integration_type === "openphone" ? webhookSecret : undefined,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      case "test": {
        // Fetch encrypted credentials
        const { data: creds, error: fetchError } = await adminClient
          .from("integration_credentials")
          .select("encrypted_credentials, phone_number")
          .eq("organization_id", organization_id)
          .eq("integration_type", integration_type)
          .single();

        if (fetchError || !creds?.encrypted_credentials) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "No credentials configured" 
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Decrypt credentials
        const decrypted = await decryptCredentials(creds.encrypted_credentials);

        let testResult = { success: false, error: "Unknown integration type" };

        if (integration_type === "twilio") {
          // Test Twilio connection
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${decrypted.account_sid}.json`;
          const response = await fetch(twilioUrl, {
            method: "GET",
            headers: {
              Authorization: "Basic " + btoa(`${decrypted.account_sid}:${decrypted.auth_token}`),
            },
          });

          if (response.ok) {
            testResult = { success: true, error: "" };
          } else {
            const errorData = await response.json();
            testResult = { success: false, error: errorData.message || "Invalid credentials" };
          }
        } else if (integration_type === "openphone") {
          // Test OpenPhone connection
          const openPhoneUrl = "https://api.openphone.com/v1/phone-numbers";
          const response = await fetch(openPhoneUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${decrypted.api_key}`,
            },
          });

          if (response.ok) {
            testResult = { success: true, error: "" };
          } else {
            testResult = { success: false, error: "Invalid API key" };
          }
        }

        // Update verification status
        await adminClient
          .from("integration_credentials")
          .update({
            is_active: testResult.success,
            last_verified_at: testResult.success ? new Date().toISOString() : null,
            last_error: testResult.success ? null : testResult.error,
          })
          .eq("organization_id", organization_id)
          .eq("integration_type", integration_type);

        return new Response(JSON.stringify(testResult), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      case "deactivate": {
        await adminClient
          .from("integration_credentials")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organization_id)
          .eq("integration_type", integration_type);

        // Deactivate phone mapping
        await adminClient
          .from("phone_number_org_mapping")
          .update({ is_active: false })
          .eq("organization_id", organization_id)
          .eq("integration_type", integration_type);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
  } catch (error) {
    console.error("Error in manage-integration-credentials:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
