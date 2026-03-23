import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── Get all broadcast quests ──────────────────────────────────────────────
// GET /api/quests
router.get("/", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("quests").orderBy("createdAt", "desc").get();
        const quests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return res.json({ quests });
    } catch (err) {
        console.error("[quests GET]", err);
        return res.status(500).json({ error: "Failed to fetch quests" });
    }
});

// ─── Create a new broadcast quest (Admin Only) ───────────────────────────
// POST /api/quests
// Body: { title, description, reward }
router.post("/", requireAuth, async (req, res) => {
    try {
        // Simple admin check based on frontend logic
        if (req.user.email !== "admin@gmail.com") {
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }

        const { title, description, reward } = req.body;
        if (!title || !description || !reward) {
            return res.status(400).json({ error: "Missing required quest fields" });
        }

        const db = getDb();
        const newQuest = {
            title,
            description,
            reward,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("quests").add(newQuest);
        return res.json({ success: true, questId: docRef.id, ...newQuest });
    } catch (err) {
        console.error("[quests POST]", err);
        return res.status(500).json({ error: "Failed to create quest" });
    }
});

// ─── Delete a quest (Admin Only) ─────────────────────────────────────────
// DELETE /api/quests/:questId
router.delete("/:questId", requireAuth, async (req, res) => {
    try {
        if (req.user.email !== "admin@gmail.com") {
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }

        const { questId } = req.params;
        if (!questId) {
            return res.status(400).json({ error: "Missing questId" });
        }

        const db = getDb();
        await db.collection("quests").doc(questId).delete();
        return res.json({ success: true });
    } catch (err) {
        console.error("[quests DELETE]", err);
        return res.status(500).json({ error: "Failed to delete quest" });
    }
});

export default router;
