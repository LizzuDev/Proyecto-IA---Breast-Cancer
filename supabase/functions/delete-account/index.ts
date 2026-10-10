// Supabase Edge Function — source lives here at supabase/functions/delete-account,
// but in the Supabase dashboard this is deployed under the function name
// "smart-action" (a naming mismatch from initial setup). The client calls it
// via supabase.functions.invoke('smart-action') in src/context/AuthContext.jsx —
// keep that name in sync with whatever this function is actually deployed as.
//
// Permanently deletes the calling user's auth.users record. profiles.id has
// ON DELETE CASCADE back to auth.users, and every other table (mood_checkins,
// beliefs, belief_practices, friends, completed_resources, breathing_streaks)
// cascades from profiles.id — so removing the auth user removes everything
// in one operation, including the login itself.
//
// This requires the service_role key (admin.deleteUser is not available to
// the anon key), which is why it must run server-side rather than in the
// client app. Supabase automatically injects SUPABASE_URL, SUPABASE_ANON_KEY,
// and SUPABASE_SERVICE_ROLE_KEY into every Edge Function's environment.
//
// Identity is verified from the caller's own JWT (sent automatically by
// supabase.functions.invoke()) before any deletion happens, so a user can
// only ever delete their own account.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Scoped to the caller's own JWT — used only to confirm who is asking.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !user) {
    return jsonResponse({ error: 'Not authenticated.' }, 401);
  }

  // Elevated client — service role, never exposed to the browser.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    return jsonResponse({ error: deleteErr.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
