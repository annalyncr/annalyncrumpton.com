// =====================================================================
// jewelbox: Supabase connection settings
//
// Where to find these in your Supabase dashboard:
//   • SUPABASE_URL      → Project Settings → Data API → "Project URL"
//                         (looks like https://abcdefghijkl.supabase.co)
//   • SUPABASE_ANON_KEY → Project Settings → API Keys → the "anon" "public"
//                         key (or the "publishable" key, starting sb_publishable_)
//
// The anon/publishable key is MEANT to be public, so it's fine for it to be
// on GitHub. The database rules in supabase-setup.sql are what keep the data safe.
//
// ⚠️ NEVER paste the "service_role" or "secret" key here. That key
//    bypasses every safety rule.
// =====================================================================

const SUPABASE_URL = "https://betpwfnfccrinhjwmhae.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KcL20wLvgi9yAKlyR10Wog_DI8dMt8H";
