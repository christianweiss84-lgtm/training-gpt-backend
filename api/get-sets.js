import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// gleicher Schutz wie beim Schreiben
function isAuthorized(req) {
  const auth = req.headers.authorization;
  return auth === `Bearer ${process.env.INGEST_SECRET}`;
}

export default async function handler(req, res) {
  // 1. Nur GET erlauben
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  // 2. Zugriff prüfen
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3. Query-Parameter lesen (optional)
  const { from, to, exercise } = req.query;

  let query = supabase
    .from("training_sets")
    .select("*")
    .order("training_date", { ascending: true })
    .order("set_order", { ascending: true });

  if (from) query = query.gte("training_date", from);
  if (to) query = query.lte("training_date", to);
  if (exercise) query = query.eq("exercise", exercise);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 4. Daten zurückgeben
  return res.json({ data });
}
