import "server-only";
import { createClient } from "@supabase/supabase-js";

export type SentCard = {
  id: string;
  token: string;
  recipient_email: string;
  message: string;
  card_title: string;
  card_image: string;
  ref_number: string;
  created_at: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function createSupabaseAdmin() {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
