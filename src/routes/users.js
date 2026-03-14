import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchRecommendations } from "../services/aiService.js";

const router = Router();

// ─── Save / update user profile & preferences after registration ───────────
// POST /api/users/profile
// Body: { name, interests: string[] }
router.post("/profile", requireAuth, async(req, res) => {
    try {
        const { name, interests } = req.body;
        if (!Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({ error: "'interests' must be a non-empty array" });
        }

        const db = getDb();
        const uid = req.user.uid;

        await db.collection("users").doc(uid).set({
            uid,
            name: name || "",
            email: req.user.email || "",
            interests,
            behaviorQueue: [],
            recommendations: [],
            recommendationsUpdatedAt: null,
            createdAt: new Date().toISOString(),
        }, { merge: true });

        return res.json({ success: true });
    } catch (err) {
        console.error("[users/profile]", err);
        return res.status(500).json({ error: "Failed to save profile" });
    }
});

// ─── Get current user profile ──────────────────────────────────────────────
// GET /api/users/profile
router.get("/profile", requireAuth, async(req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("users").doc(req.user.uid).get();
        if (!snap.exists) return res.status(404).json({ error: "Profile not found" });
        return res.json(snap.data());
    } catch (err) {
        console.error("[users/profile GET]", err);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// ─── Trigger / refresh recommendations for the signed-in user ─────────────
// POST /api/users/recommendations/refresh
router.post("/recommendations/refresh", requireAuth, async(req, res) => {
    try {
        const db = getDb();
        const uid = req.user.uid;
        const snap = await db.collection("users").doc(uid).get();

        if (!snap.exists) {
            return res.status(404).json({ error: "User profile not found. Complete registration first." });
        }

        const data = snap.data();
        const { interests = [], behaviorQueue = [] } = data;

        // Call AI service
        const result = await fetchRecommendations(uid, interests, behaviorQueue);

        // Persist recommendations in Firestore
        await db.collection("users").doc(uid).update({
            recommendations: result.recommendations,
            recommendationsUpdatedAt: new Date().toISOString(),
        });

        return res.json(result);
    } catch (err) {
        console.error("[recommendations/refresh]", err);
        return res.status(500).json({ error: "Failed to refresh recommendations" });
    }
});

// ─── Get cached recommendations ───────────────────────────────────────────
// GET /api/users/recommendations
router.get("/recommendations", requireAuth, async(req, res) => {
    try {
        const db = getDb();
        const snap = await db.collection("users").doc(req.user.uid).get();
        if (!snap.exists) return res.status(404).json({ error: "Profile not found" });

        const { recommendations = [], recommendationsUpdatedAt = null } = snap.data();
        return res.json({ recommendations, updatedAt: recommendationsUpdatedAt });
    } catch (err) {
        console.error("[recommendations GET]", err);
        return res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});

export default router;