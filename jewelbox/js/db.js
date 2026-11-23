// =====================================================================
// db.js: every conversation with Supabase lives in this one file.
//
// The other files never talk to Supabase directly; they call these
// functions instead (JB.db.listMixtapes(), JB.db.publishMixtape(...), ...).
// That way, if the database ever changes, only this file needs editing.
// =====================================================================

window.JB = window.JB || {};

JB.db = (function () {
  // The columns visitors are allowed to read. secret_hash is deliberately
  // missing: the database refuses to hand it out (see supabase-setup.sql),
  // so asking for "*" (every column) would cause an error.
  const PUBLIC_COLUMNS = "id, created_at, updated_at, title, creator_name, cover, tracklist, disc";

  // config.js still has its placeholder text until you paste in real values.
  const hasRealConfig =
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    !SUPABASE_ANON_KEY.startsWith("PASTE_");

  // window.supabase is created by the supabase-js <script> tag in index.html.
  const client = hasRealConfig && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  function requireClient() {
    if (!client) throw new Error("jewelbox isn't connected to Supabase yet. Add your keys to config.js.");
    return client;
  }

  // Supabase answers every request with { data, error }. This helper hands
  // back the data, or throws the error so callers can show a friendly message.
  function unwrap({ data, error }) {
    if (error) throw error;
    return data;
  }

  return {
    isConfigured: () => Boolean(client),

    // Community Library: newest CDs first.
    async listMixtapes(limit = 60) {
      return unwrap(await requireClient()
        .from("mixtapes")
        .select(PUBLIC_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(limit));
    },

    // Publish a brand-new CD. Returns its id.
    async publishMixtape({ creatorName, secretWord, title, cover, tracklist, disc }) {
      return unwrap(await requireClient().rpc("publish_mixtape", {
        p_creator_name: creatorName,
        p_secret_word: secretWord,
        p_title: title,
        p_cover: cover,
        p_tracklist: tracklist,
        p_disc: disc
      }));
    },

    // My Stash: the CDs matching a name + secret word.
    async myMixtapes({ creatorName, secretWord }) {
      return unwrap(await requireClient().rpc("my_mixtapes", {
        p_creator_name: creatorName,
        p_secret_word: secretWord
      }));
    },

    async updateMixtape({ id, creatorName, secretWord, title, cover, tracklist, disc }) {
      return unwrap(await requireClient().rpc("update_mixtape", {
        p_id: id,
        p_creator_name: creatorName,
        p_secret_word: secretWord,
        p_title: title,
        p_cover: cover,
        p_tracklist: tracklist,
        p_disc: disc
      }));
    },

    async deleteMixtape({ id, creatorName, secretWord }) {
      return unwrap(await requireClient().rpc("delete_mixtape", {
        p_id: id,
        p_creator_name: creatorName,
        p_secret_word: secretWord
      }));
    }
  };
})();
