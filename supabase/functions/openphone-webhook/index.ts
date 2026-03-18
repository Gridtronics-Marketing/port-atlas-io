import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openphone-signature',
};

interface OpenPhoneWebhookPayload {
  id: string;
  type: 'call.started' | 'call.ended' | 'voicemail.received';
  data: {
    id: string;
    direction: 'inbound' | 'outbound';
    from: string;
    to: string;
    status: 'completed' | 'missed' | 'voicemail' | 'busy';
    duration?: number;
    recording_url?: string;
    transcription?: string;
    started_at: string;
    ended_at?: string;
  };
}

// Verify OpenPhone webhook signature
async function verifySignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!signature || !webhookSecret) {
    console.warn('No signature or webhook secret provided');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for all operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const payload: OpenPhoneWebhookPayload = JSON.parse(rawBody);
    console.log('OpenPhone webhook received:', payload.type);

    // Extract phone number to lookup organization
    const phoneNumber = payload.data.direction === 'inbound' 
      ? payload.data.to 
      : payload.data.from;

    // Clean phone number for lookup
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const phoneVariants = [
      phoneNumber,
      `+${cleanPhone}`,
      cleanPhone,
      cleanPhone.slice(-10),
    ];

    // Lookup organization from phone number mapping
    const { data: phoneMapping, error: mappingError } = await supabase
      .from('phone_number_org_mapping')
      .select('organization_id, integration_type')
      .eq('integration_type', 'openphone')
      .eq('is_active', true)
      .or(phoneVariants.map(p => `phone_number.ilike.%${p.slice(-10)}%`).join(','))
      .limit(1)
      .single();

    if (mappingError || !phoneMapping) {
      console.error('No organization found for phone number:', phoneNumber);
      // Still return 200 to prevent webhook retries
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Organization not found for phone number' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const organizationId = phoneMapping.organization_id;

    // Fetch integration credentials for signature verification
    const { data: credentials } = await supabase
      .from('integration_credentials')
      .select('webhook_secret, is_active, settings')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'openphone')
      .single();

    // Verify webhook signature - fail closed if no secret configured
    if (!credentials?.webhook_secret) {
      console.error('Webhook secret not configured for org:', organizationId);
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('x-openphone-signature');
    const isValid = await verifySignature(rawBody, signature, credentials.webhook_secret);
    
    if (!isValid) {
      console.error('Invalid webhook signature for org:', organizationId);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!credentials?.is_active) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenPhone integration is not active' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process based on event type
    switch (payload.type) {
      case 'call.started':
        await handleCallStarted(supabase, payload, organizationId);
        break;
      case 'call.ended':
        await handleCallEnded(supabase, payload, organizationId, credentials.settings);
        break;
      case 'voicemail.received':
        await handleVoicemailReceived(supabase, payload, organizationId);
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing OpenPhone webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCallStarted(
  supabase: ReturnType<typeof createClient>, 
  payload: OpenPhoneWebhookPayload,
  organizationId: string
) {
  const { data: callData } = payload;
  
  // Match contact within organization
  const contact = await matchContact(
    supabase, 
    callData.direction === 'inbound' ? callData.from : callData.to,
    organizationId
  );
  
  const { data, error } = await supabase
    .from('openphone_call_logs')
    .insert([{
      openphone_call_id: callData.id,
      direction: callData.direction,
      phone_number: callData.direction === 'inbound' ? callData.from : callData.to,
      contact_id: contact?.id,
      contact_type: contact?.type,
      call_status: 'in_progress',
      duration_seconds: 0,
      started_at: callData.started_at,
      organization_id: organizationId,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error logging call start:', error);
    return;
  }

  console.log('Call logged:', data.id);
}

async function handleCallEnded(
  supabase: ReturnType<typeof createClient>, 
  payload: OpenPhoneWebhookPayload,
  organizationId: string,
  settings?: Record<string, boolean>
) {
  const { data: callData } = payload;
  
  const { error } = await supabase
    .from('openphone_call_logs')
    .update({
      call_status: callData.status,
      duration_seconds: callData.duration || 0,
      recording_url: callData.recording_url,
      transcription: callData.transcription,
      ended_at: callData.ended_at,
    })
    .eq('openphone_call_id', callData.id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error updating call log:', error);
  }

  // Auto-create work order if enabled
  if (settings?.auto_create_work_orders && 
      callData.direction === 'inbound' && 
      callData.duration && 
      callData.duration > 30) {
    await autoCreateWorkOrder(supabase, callData, organizationId);
  }
}

async function handleVoicemailReceived(
  supabase: ReturnType<typeof createClient>, 
  payload: OpenPhoneWebhookPayload,
  organizationId: string
) {
  const { data: callData } = payload;
  
  const { error } = await supabase
    .from('openphone_call_logs')
    .upsert({
      openphone_call_id: callData.id,
      direction: callData.direction,
      phone_number: callData.from,
      call_status: 'voicemail',
      recording_url: callData.recording_url,
      transcription: callData.transcription,
      started_at: callData.started_at,
      ended_at: callData.ended_at,
      organization_id: organizationId,
      duration_seconds: 0,
    });

  if (error) {
    console.error('Error logging voicemail:', error);
  }
}

async function matchContact(
  supabase: ReturnType<typeof createClient>, 
  phoneNumber: string,
  organizationId: string
) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Search employees in organization
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, phone, email, organization_id')
    .eq('organization_id', organizationId)
    .ilike('phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (employees && employees.length > 0) {
    const emp = employees[0];
    return {
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      type: 'employee' as const,
      phone: emp.phone,
      email: emp.email,
    };
  }

  // Search clients in organization
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, contact_email, organization_id')
    .eq('organization_id', organizationId)
    .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (clients && clients.length > 0) {
    const client = clients[0];
    return {
      id: client.id,
      name: client.contact_name || client.name,
      type: 'client' as const,
      phone: client.contact_phone,
      email: client.contact_email,
    };
  }

  // Search suppliers in organization
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, contact_phone, contact_email, organization_id')
    .eq('organization_id', organizationId)
    .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (suppliers && suppliers.length > 0) {
    const supplier = suppliers[0];
    return {
      id: supplier.id,
      name: supplier.contact_name || supplier.name,
      type: 'supplier' as const,
      phone: supplier.contact_phone,
      email: supplier.contact_email,
    };
  }

  return null;
}

async function autoCreateWorkOrder(
  supabase: ReturnType<typeof createClient>,
  callData: OpenPhoneWebhookPayload['data'],
  organizationId: string
) {
  const workOrderData = {
    title: `Call Follow-up - ${callData.from}`,
    description: `Auto-generated from inbound call.\nDuration: ${Math.floor((callData.duration || 0) / 60)}:${((callData.duration || 0) % 60).toString().padStart(2, '0')}\nPhone: ${callData.from}`,
    status: 'open',
    priority: 'medium',
    organization_id: organizationId,
  };

  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .insert([workOrderData])
    .select()
    .single();

  if (!error && workOrder) {
    await supabase
      .from('openphone_call_logs')
      .update({ work_order_created: workOrder.id })
      .eq('openphone_call_id', callData.id)
      .eq('organization_id', organizationId);
    
    console.log('Auto-created work order:', workOrder.id);
  } else {
    console.error('Error auto-creating work order:', error);
  }
}
