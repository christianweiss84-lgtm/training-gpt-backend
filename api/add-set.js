import { createClient } from "@supabase/supabase-js";

/**
 * Verbindung zu Supabase
 * (Schlüssel kommen NICHT aus dem Code,
 * sondern später aus Vercel-Environment-Variablen)
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Mini-Schutz:
 * Nur wer das Secret kennt, darf schreiben
 */
function isAuthorized(req) {
  const auth = req.headers.authorization;
  return auth === `Bearer ${process.env.INGEST_SECRET}`;
}

export default async function handler(req, res) {
  // 1. Nur POST erlauben
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // 2. Zugriff prüfen
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3. Daten aus dem Request lesen
  const {
    training_date,
    exercise,
    weight_kg,
    reps,
    set_order
  } = req.body || {};

  // 4. Pflichtfelder prüfen
  if (
    !training_date ||
    !exercise ||
    weight_kg == null ||
    reps == null ||
    set_order == null
  ) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 5. In Supabase speichern
  const { error } = await supabase
    .from("training_sets")
    .insert([{
      training_date,
      exercise,
      weight_kg,
      reps,
      set_order
    }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 6. Erfolg zurückmelden
  return res.json({ ok: true });
}
