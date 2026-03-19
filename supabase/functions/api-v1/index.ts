import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// SHA-256 hash helper
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Parse pagination params
function paginate(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const per_page = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("per_page") || "25", 10))
  );
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  return { page, per_page, from, to };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Authenticate via API key ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return error("Missing or invalid Authorization header", 401);
  }
  const apiKey = authHeader.replace("Bearer ", "");
  const keyHash = await hashKey(apiKey);

  const { data: keyRow, error: keyErr } = await supabaseAdmin
    .from("api_keys")
    .select("id, organization_id, scopes, is_active, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (keyErr || !keyRow) {
    return error("Invalid API key", 401);
  }
  if (!keyRow.is_active) {
    return error("API key is inactive", 403);
  }
  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return error("API key has expired", 403);
  }

  const orgId: string = keyRow.organization_id;
  const scopes: string[] = keyRow.scopes || [];

  // Update last_used_at (fire-and-forget)
  supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then();

  // --- Route ---
  const url = new URL(req.url);
  // The resource path comes after the function name in the URL
  // e.g. /api-v1/locations or via ?path=locations
  const rawPath =
    url.searchParams.get("path") ||
    url.pathname.replace(/^\/api-v1\/?/, "").replace(/^\//, "");
  const resource = rawPath.split("/")[0] || "";
  const method = req.method;

  // --- Handlers ---

  // GET /locations
  if (method === "GET" && resource === "locations") {
    if (!scopes.includes("locations:read") && scopes.length > 0) {
      return error("Insufficient scope: locations:read required", 403);
    }
    const { page, per_page, from, to } = paginate(url);

    const { data, error: dbErr, count } = await supabaseAdmin
      .from("locations")
      .select("id, name, address, city, state, zip_code, building_type, num_floors, created_at", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (dbErr) return error(dbErr.message, 500);
    return json({ data, meta: { total: count, page, per_page } });
  }

  // POST /locations
  if (method === "POST" && resource === "locations") {
    if (!scopes.includes("locations:write") && scopes.length > 0) {
      return error("Insufficient scope: locations:write required", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body?.name) return error("Field 'name' is required");

    const { data, error: dbErr } = await supabaseAdmin
      .from("locations")
      .insert({
        name: body.name,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zip_code: body.zip_code || null,
        building_type: body.building_type || null,
        num_floors: body.num_floors || null,
        organization_id: orgId,
      })
      .select()
      .single();

    if (dbErr) return error(dbErr.message, 500);
    return json({ data }, 201);
  }

  // GET /drop-points
  if (method === "GET" && resource === "drop-points") {
    if (!scopes.includes("drop-points:read") && scopes.length > 0) {
      return error("Insufficient scope: drop-points:read required", 403);
    }
    const { page, per_page, from, to } = paginate(url);
    const locationId = url.searchParams.get("location_id");

    let query = supabaseAdmin
      .from("drop_points")
      .select("id, label, drop_type, status, floor, room, location_id, created_at", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error: dbErr, count } = await query;
    if (dbErr) return error(dbErr.message, 500);
    return json({ data, meta: { total: count, page, per_page } });
  }

  // POST /work-orders
  if (method === "POST" && resource === "work-orders") {
    if (!scopes.includes("work-orders:write") && scopes.length > 0) {
      return error("Insufficient scope: work-orders:write required", 403);
    }
    const body = await req.json().catch(() => null);
    if (!body?.title) return error("Field 'title' is required");

    const { data, error: dbErr } = await supabaseAdmin
      .from("work_orders")
      .insert({
        title: body.title,
        description: body.description || null,
        priority: body.priority || "medium",
        status: body.status || "pending",
        location_id: body.location_id || null,
        assigned_to: body.assigned_to || null,
        organization_id: orgId,
      })
      .select()
      .single();

    if (dbErr) return error(dbErr.message, 500);
    return json({ data }, 201);
  }

  // GET /employees
  if (method === "GET" && resource === "employees") {
    if (!scopes.includes("employees:read") && scopes.length > 0) {
      return error("Insufficient scope: employees:read required", 403);
    }
    const { page, per_page, from, to } = paginate(url);

    const { data, error: dbErr, count } = await supabaseAdmin
      .from("employees")
      .select("id, first_name, last_name, email, role, department, status, created_at", { count: "exact" })
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (dbErr) return error(dbErr.message, 500);
    return json({ data, meta: { total: count, page, per_page } });
  }

  return error(`Unknown endpoint: ${method} /${resource}`, 404);
});
