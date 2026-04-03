/**
 * server/app.ts — single backend entry point.
 *
 * Three roles in one file:
 *   1. Re-exports Next.js-compatible route handlers (used by src/app/api/*)
 *   2. Builds and exports the Express app
 *   3. Starts the HTTP server when executed directly:
 *        npm run dev:server   →   tsx --tsconfig tsconfig.server.json server/app.ts
 */

// ── 1. Next.js route handler re-exports ────────────────────────────────────────
export { neighborhoodRoute } from "./routes/neighborhoodRoute";
export { suggestionsRoute }  from "./routes/suggestionsRoute";

// ── 2. Express application ─────────────────────────────────────────────────────
import express, { type Request, type Response } from "express";
import cors from "cors";
import { getNeighborhoodScore }      from "@server/services/neighborhoodService";
import { getAddressSuggestions }     from "@server/services/suggestionsService";
import { AppError, httpStatusForError } from "@server/lib/errors";

const app = express();

app.use(cors());
app.use(express.json());

// GET /api/neighborhood?address=<address>
app.get("/api/neighborhood", async (req: Request, res: Response) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";

  try {
    const data = await getNeighborhoodScore(address);
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.json({ ok: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(httpStatusForError(err.code)).json({ ok: false, error: err.message });
      return;
    }
    console.error("[/api/neighborhood]", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// GET /api/suggestions?q=<query>
app.get("/api/suggestions", async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  try {
    const data = await getAddressSuggestions(query);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ ok: true, data });
  } catch (err) {
    console.error("[/api/suggestions]", err);
    res.json({ ok: true, data: [] });
  }
});

export default app;

// ── 3. Standalone entry point ──────────────────────────────────────────────────
// Start the HTTP server only when this file is run directly (not when imported).
if (require.main === module) {
  const PORT = Number(process.env.PORT ?? 3001);
  app.listen(PORT, () => {
    console.log(`[server] API listening on http://localhost:${PORT}`);
  });
}
