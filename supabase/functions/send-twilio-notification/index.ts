import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  phoneNumber: string;
  title: string;
  message: string;
  type: 'scheduling' | 'work_order' | 'chat' | 'system';
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, phoneNumber, title, message, type, data }: NotificationRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Twilio settings
    const { data: settings, error: settingsError } = await supabase
      .from('twilio_settings')
      .select('*')
      .single();

    if (settingsError || !settings?.enabled || !settings?.push_notifications_enabled) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio notifications are not enabled'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

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

    // Send SMS via Twilio if phone number is provided and settings allow
    if (phoneNumber && settings.account_sid && settings.auth_token && settings.phone_number) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.account_sid}/Messages.json`;
        
        const formData = new FormData();
        formData.append('From', settings.phone_number);
        formData.append('To', phoneNumber);
        formData.append('Body', `${title}\n\n${message}`);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${settings.account_sid}:${settings.auth_token}`),
          },
          body: formData,
        });

        if (response.ok) {
          // Update notification to mark as sent via Twilio
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
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
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
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
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
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationId: notification.id,
      smsSent: false,
      message: 'Notification created but SMS not configured'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-twilio-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send notification'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);