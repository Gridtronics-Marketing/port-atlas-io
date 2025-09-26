import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const payload: OpenPhoneWebhookPayload = await req.json();
    console.log('OpenPhone webhook received:', payload);

    // Process based on event type
    switch (payload.type) {
      case 'call.started':
        await handleCallStarted(supabase, payload);
        break;
      case 'call.ended':
        await handleCallEnded(supabase, payload);
        break;
      case 'voicemail.received':
        await handleVoicemailReceived(supabase, payload);
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

async function handleCallStarted(supabase: any, payload: OpenPhoneWebhookPayload) {
  const { data: callData } = payload;
  
  // Try to match contact
  const contact = await matchContact(supabase, callData.direction === 'inbound' ? callData.from : callData.to);
  
  // Log the call start
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
    }])
    .select()
    .single();

  if (error) {
    console.error('Error logging call start:', error);
    return;
  }

  // Send screen-pop notification if enabled
  await sendScreenPopNotification(supabase, {
    callId: data.id,
    direction: callData.direction,
    phoneNumber: callData.direction === 'inbound' ? callData.from : callData.to,
    contact: contact,
  });
}

async function handleCallEnded(supabase: any, payload: OpenPhoneWebhookPayload) {
  const { data: callData } = payload;
  
  // Update the call log
  const { error } = await supabase
    .from('openphone_call_logs')
    .update({
      call_status: callData.status,
      duration_seconds: callData.duration || 0,
      recording_url: callData.recording_url,
      transcription: callData.transcription,
      ended_at: callData.ended_at,
    })
    .eq('openphone_call_id', callData.id);

  if (error) {
    console.error('Error updating call log:', error);
  }

  // Check if auto work order creation is enabled
  const shouldCreateWorkOrder = await checkAutoWorkOrderSetting(supabase);
  if (shouldCreateWorkOrder && callData.direction === 'inbound' && callData.duration && callData.duration > 30) {
    await autoCreateWorkOrder(supabase, callData);
  }
}

async function handleVoicemailReceived(supabase: any, payload: OpenPhoneWebhookPayload) {
  const { data: callData } = payload;
  
  // Update or create voicemail record
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
    });

  if (error) {
    console.error('Error logging voicemail:', error);
  }
}

async function matchContact(supabase: any, phoneNumber: string) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Search employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, phone, email')
    .ilike('phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (employees && employees.length > 0) {
    const emp = employees[0];
    return {
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      type: 'employee',
      phone: emp.phone,
      email: emp.email,
    };
  }

  // Search clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, contact_name, contact_phone, contact_email')
    .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (clients && clients.length > 0) {
    const client = clients[0];
    return {
      id: client.id,
      name: client.contact_name || client.name,
      type: 'client',
      phone: client.contact_phone,
      email: client.contact_email,
    };
  }

  // Search suppliers
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, contact_phone, contact_email')
    .ilike('contact_phone', `%${cleanPhone.slice(-10)}%`)
    .limit(1);

  if (suppliers && suppliers.length > 0) {
    const supplier = suppliers[0];
    return {
      id: supplier.id,
      name: supplier.contact_name || supplier.name,
      type: 'supplier',
      phone: supplier.contact_phone,
      email: supplier.contact_email,
    };
  }

  return null;
}

async function sendScreenPopNotification(supabase: any, data: any) {
  // This would integrate with a real-time notification system
  // For now, we'll just log it
  console.log('Screen-pop notification:', data);
  
  // In a real implementation, you might:
  // 1. Send a real-time message via Supabase Realtime
  // 2. Trigger a push notification
  // 3. Send via WebSocket to connected clients
}

async function checkAutoWorkOrderSetting(supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('procurement_settings')
    .select('setting_value')
    .eq('setting_key', 'openphone_config')
    .single();

  return data?.setting_value?.auto_create_work_orders || false;
}

async function autoCreateWorkOrder(supabase: any, callData: any) {
  // Auto-create work order for inbound calls over 30 seconds
  const workOrderData = {
    title: `Call Follow-up - ${callData.from}`,
    description: `Auto-generated work order from inbound call.\nCall Duration: ${Math.floor(callData.duration / 60)}:${(callData.duration % 60).toString().padStart(2, '0')}\nPhone: ${callData.from}`,
    status: 'open',
    priority: 'medium',
    phone_number: callData.from,
    call_reference: callData.id,
  };

  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .insert([workOrderData])
    .select()
    .single();

  if (!error) {
    // Update call log with work order reference
    await supabase
      .from('openphone_call_logs')
      .update({ work_order_created: workOrder.id })
      .eq('openphone_call_id', callData.id);
    
    console.log('Auto-created work order:', workOrder.id);
  } else {
    console.error('Error auto-creating work order:', error);
  }
}