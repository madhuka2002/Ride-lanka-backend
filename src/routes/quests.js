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

        const { title, description, reward, badgeImage } = req.body;
        if (!title || !description || !reward) {
            return res.status(400).json({ error: "Missing required quest fields" });
        }

        const db = getDb();
        const newQuest = {
            title,
            description,
            reward,
            badgeImage: badgeImage || null,
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

// ─── Complete a quest and gain XP & Badge ────────────────────────────────
// POST /api/quests/:questId/complete
router.post("/:questId/complete", requireAuth, async (req, res) => {
    try {
        const { questId } = req.params;
        const db = getDb();
        const uid = req.user.uid;

        const questSnap = await db.collection("quests").doc(questId).get();
        if (!questSnap.exists) return res.status(404).json({ error: "Quest not found" });
        const questData = questSnap.data();

        let xpGained = 0;
        if (questData.reward) {
            const match = questData.reward.match(/\d+/);
            if (match) xpGained = parseInt(match[0], 10);
        }
        
        const badgeToken = questData.badgeImage ? { 
            id: questId, 
            name: questData.title, 
            url: questData.badgeImage 
        } : null;

        const userRef = db.collection("users").doc(uid);

        await db.runTransaction(async (tx) => {
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists) throw new Error("User profile not found");
            const userData = userSnap.data();
            
            const completedQuests = userData.completedQuests || [];
            if (completedQuests.includes(questId)) {
                throw new Error("ALREADY_COMPLETED");
            }

            const currentXp = userData.xp || 0;
            const currentBadges = userData.badges || [];
            
            const newBadges = [...currentBadges];
            if (badgeToken) {
                const hasBadge = currentBadges.some(b => b.id === questId);
                if (!hasBadge) newBadges.push(badgeToken);
            }

            const newCompletedQuests = [...completedQuests, questId];

            tx.update(userRef, { 
                xp: currentXp + xpGained,
                badges: newBadges,
                completedQuests: newCompletedQuests
            });
        });

        return res.json({ success: true, xpGained });
    } catch (err) {
        if (err.message === "ALREADY_COMPLETED") {
            return res.status(400).json({ error: "Quest already completed by user." });
        }
        console.error("[quests complete]", err);
        return res.status(500).json({ error: "Failed to complete quest" });
    }
});

export default router;
