import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const MAX_QUEUE_SIZE = 50;

const VALID_ACTIONS = ["view", "save", "book", "search"];
const VALID_CATEGORIES = [
    "culture", "nature", "beach", "wildlife", "food",
    "adventure", "hiking", "dance", "general",
];

// ─── Track a user interaction event ───────────────────────────────────────
// POST /api/events
// Body: { place_name, category, action }
router.post("/", requireAuth, async(req, res) => {
    try {
        const { place_name, category, action } = req.body;

        if (!place_name || typeof place_name !== "string") {
            return res.status(400).json({ error: "'place_name' is required" });
        }
        if (!VALID_ACTIONS.includes(action)) {
            return res.status(400).json({ error: `'action' must be one of: ${VALID_ACTIONS.join(", ")}` });
        }
        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `'category' must be one of: ${VALID_CATEGORIES.join(", ")}` });
        }

        const newEvent = {
            place_name: place_name.substring(0, 200), // sanitize length
            category,
            action,
            timestamp: new Date().toISOString(),
        };

        const db = getDb();
        const uid = req.user.uid;
        const ref = db.collection("users").doc(uid);

        // Firestore transaction: read queue, enforce 50-element limit, append new event
        await db.runTransaction(async(tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new Error("User profile not found");

            const queue = snap.data().behaviorQueue || [];

            // FIFO: drop the oldest when we hit the limit
            if (queue.length >= MAX_QUEUE_SIZE) {
                queue.shift();
            }
            queue.push(newEvent);

            tx.update(ref, { behaviorQueue: queue });
        });

        return res.json({ success: true, event: newEvent });
    } catch (err) {
        console.error("[events POST]", err);
        return res.status(500).json({ error: "Failed to record event" });
    }
});

// ─── Get current behavior queue ────────────────────────────────────────────
// GET /api/events
router.get("/", requireAuth, async(req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("users").doc(req.user.uid).get();
        if (!snap.exists) return res.status(404).json({ error: "Profile not found" });

        return res.json({ behaviorQueue: snap.data().behaviorQueue || [] });
    } catch (err) {
        console.error("[events GET]", err);
        return res.status(500).json({ error: "Failed to fetch events" });
    }
});

export default router;