/* MGodwill+ gallery connection (v7).
   Both values are PUBLIC by design: the key below is Supabase's "publishable" (anon) key.
   What visitors may do is controlled by the database's row-level security, not by hiding this key.
   NEVER put a secret / service_role key in this file. While "key" is empty the Photos section stays hidden. */
const MG_SUPABASE = {
  url: "https://oalrbfjmyiotocqdfxaw.supabase.co",
  key: ""
};
