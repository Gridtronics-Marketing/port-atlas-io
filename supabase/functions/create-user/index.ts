import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password?: string;
  sendInvitation?: boolean;
  roles: string[];
  createEmployee?: boolean;
  firstName?: string;
  lastName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the caller is authenticated and has admin role
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller has admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id);

    const isAdmin = callerRoles?.some(r => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions - admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, sendInvitation, roles, createEmployee, firstName, lastName } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one role is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string;
    let inviteLink: string | null = null;

    // Fetch app domain from platform settings
    const { data: platformSettings } = await supabaseAdmin
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "email_branding")
      .single();

    const appDomain = platformSettings?.setting_value?.app_domain || "https://port-atlas-io.lovable.app";

    if (sendInvitation) {
      // Mode: Send Magic Link Invitation
      console.log("Creating user with magic link invitation:", email);

      // Generate magic link for the user
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: `${appDomain}/auth?type=magiclink`
        }
      });

      if (linkError) {
        console.error("Error generating magic link:", linkError);
        throw new Error(`Failed to generate invitation link: ${linkError.message}`);
      }

      userId = linkData.user.id;
      
      // Extract the token from the action link and build proper invite URL
      const actionLink = linkData.properties?.action_link;
      if (actionLink) {
        const url = new URL(actionLink);
        const tokenHash = url.hash || url.searchParams.get("token_hash") || "";
        const token = url.searchParams.get("token") || "";
        
        // Build the invite link using app domain
        if (tokenHash) {
          inviteLink = `${appDomain}/auth${tokenHash}`;
        } else if (token) {
          inviteLink = `${appDomain}/auth?token=${token}&type=magiclink`;
        } else {
          // Fallback: use the original link but replace the domain
          inviteLink = actionLink.replace(url.origin, appDomain);
        }
      }

      console.log("Generated invite link for:", email);

    } else if (password) {
      // Mode: Admin Sets Password
      console.log("Creating user with admin-set password:", email);

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Skip email verification - admin vouches for user
        user_metadata: {
          full_name: firstName && lastName ? `${firstName} ${lastName}` : undefined
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = userData.user.id;
      console.log("User created with ID:", userId);

    } else {
      return new Response(
        JSON.stringify({ error: "Either password or sendInvitation must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign roles to the user
    console.log("Assigning roles:", roles);
    for (const role of roles) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: role });

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Error assigning role:", roleError);
        // Continue with other roles even if one fails
      }
    }

    // Optionally create employee record
    let employeeId: string | null = null;
    if (createEmployee && firstName && lastName) {
      console.log("Creating employee record");
      
      // Get caller's organization
      const { data: callerMembership } = await supabaseAdmin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", callerUser.id)
        .single();

      const { data: employeeData, error: employeeError } = await supabaseAdmin
        .from("employees")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          role: roles[0] || "technician",
          status: "active",
          organization_id: callerMembership?.organization_id
        })
        .select("id")
        .single();

      if (employeeError) {
        console.error("Error creating employee:", employeeError);
        // Don't fail the whole operation for employee creation failure
      } else {
        employeeId = employeeData?.id;
      }
    }

    // If invitation mode, send branded email
    if (sendInvitation && inviteLink) {
      console.log("Sending branded invitation email");
      
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-user-invitation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            email: email,
            inviteLink: inviteLink,
            userName: firstName || email.split("@")[0],
            roles: roles
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error("Error sending invitation email:", errorText);
          // Don't fail the whole operation - user is created, just email failed
        } else {
          console.log("Invitation email sent successfully");
        }
      } catch (emailError) {
        console.error("Error calling email function:", emailError);
        // Continue - user is created
      }
    }

    // Log the action
    await supabaseAdmin
      .from("user_activity_log")
      .insert({
        user_id: userId,
        actor_id: callerUser.id,
        activity_type: sendInvitation ? "user_invited" : "user_created",
        activity_description: sendInvitation 
          ? `User invited via magic link by admin`
          : `User created with admin-set password`,
        metadata: {
          roles: roles,
          createEmployee: createEmployee,
          invitationSent: sendInvitation
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        employeeId: employeeId,
        invitationSent: sendInvitation,
        message: sendInvitation 
          ? "User created and invitation email sent"
          : "User created successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
