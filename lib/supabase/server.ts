import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";
export function publicClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}
export async function sessionClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Read-only server render; proxy refreshes cookies. */
        }
      },
    },
  });
}
// Never import this module into a Client Component.
export function serviceClient() {
  const config = supabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key) throw new Error("Backend configuration is incomplete");
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
