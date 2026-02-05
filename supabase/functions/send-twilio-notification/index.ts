import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Decrypt credentials using the same method as manage-integration-credentials
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

async function decryptCredentials(encryptedData: string): Promise<Record<string, string>> {
  const key = await getEncryptionKey();
  
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

interface NotificationRequest {
  organization_id: string;
  userId: string;
  phoneNumber: string;
  title: string;
  message: string;
  type: 'scheduling' | 'work_order' | 'chat' | 'system';
  data?: Record<string, unknown>;
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

    // Verify user JWT
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

    // Use service role for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organization_id, userId, phoneNumber, title, message, type, data }: NotificationRequest = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'organization_id is required'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch Twilio credentials for this organization from integration_credentials
    const { data: credentials, error: credError } = await supabase
      .from('integration_credentials')
      .select('encrypted_credentials, is_active, settings')
      .eq('organization_id', organization_id)
      .eq('integration_type', 'twilio')
      .single();

    if (credError || !credentials?.is_active || !credentials?.encrypted_credentials) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio is not configured or enabled for this organization'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if push notifications are enabled
    if (!credentials.settings?.push_notifications_enabled) {
      return new Response(JSON.stringify({
        success: false,
        error: 'SMS notifications are not enabled for this organization'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Decrypt credentials
    const twilioCredentials = await decryptCredentials(credentials.encrypted_credentials);

    // Create notification record in database
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        sent_via_twilio: false
      })
      .select()
      .single();

    if (notificationError) {
      throw notificationError;
    }

    // Send SMS via Twilio
    if (phoneNumber && twilioCredentials.account_sid && twilioCredentials.auth_token && twilioCredentials.phone_number) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioCredentials.account_sid}/Messages.json`;
        
        const formData = new FormData();
        formData.append('From', twilioCredentials.phone_number);
        formData.append('To', phoneNumber);
        formData.append('Body', `${title}\n\n${message}`);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioCredentials.account_sid}:${twilioCredentials.auth_token}`),
          },
          body: formData,
        });

        if (response.ok) {
          await supabase
            .from('notifications')
            .update({ sent_via_twilio: true })
            .eq('id', notification.id);

          return new Response(JSON.stringify({
            success: true,
            notificationId: notification.id,
            smsSent: true
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } else {
          const errorData = await response.json();
          console.error('Twilio SMS error:', errorData);
          
          return new Response(JSON.stringify({
            success: true,
            notificationId: notification.id,
            smsSent: false,
            smsError: errorData.message
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
        
        return new Response(JSON.stringify({
          success: true,
          notificationId: notification.id,
          smsSent: false,
          smsError: 'Failed to send SMS'
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationId: notification.id,
      smsSent: false,
      message: 'Notification created but SMS not sent (no phone number)'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error in send-twilio-notification:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
