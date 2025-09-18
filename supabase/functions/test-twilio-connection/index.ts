import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
  phoneNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountSid, authToken, phoneNumber }: TestConnectionRequest = await req.json();

    // Validate credentials by making a request to Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
    });

    if (response.ok) {
      const accountInfo = await response.json();
      
      // If phone number is provided, also validate it
      if (phoneNumber) {
        const phoneUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
        const phoneResponse = await fetch(phoneUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          },
        });

        if (phoneResponse.ok) {
          const phoneData = await phoneResponse.json();
          const hasPhoneNumber = phoneData.incoming_phone_numbers?.some(
            (phone: any) => phone.phone_number === phoneNumber
          );

          if (!hasPhoneNumber) {
            return new Response(JSON.stringify({
              success: false,
              error: `Phone number ${phoneNumber} not found in your Twilio account`
            }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        accountName: accountInfo.friendly_name,
        accountSid: accountInfo.sid,
        status: accountInfo.status
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      const errorData = await response.json();
      return new Response(JSON.stringify({
        success: false,
        error: errorData.message || 'Invalid Twilio credentials'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  } catch (error: any) {
    console.error("Error in test-twilio-connection function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to test connection'
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