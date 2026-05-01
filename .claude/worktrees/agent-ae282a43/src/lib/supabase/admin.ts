import { createClient } from "@supabase/supabase-js";

// Server-only admin client — bypasses RLS.
// NEVER import this file in a Client Component or file with 'use client'.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
