import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchRecommendations, fetchTripPlan, fetchCulture } from "../services/aiService.js";

const router = Router();

// ─── Save / update user profile & preferences after registration ───────────
// POST /api/users/profile
// Body: { name, interests: string[] }
router.post("/profile", requireAuth, async (req, res) => {
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
router.get("/profile", requireAuth, async (req, res) => {
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
router.post("/recommendations/refresh", requireAuth, async (req, res) => {
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
router.get("/recommendations", requireAuth, async (req, res) => {
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

// ─── Generate trip plan for new trip form ─────────────────────────────────
// POST /api/users/trips/plan
// Body: { trip_name, trip_date, stop_count, favorites }
router.post("/trips/plan", requireAuth, async (req, res) => {
    try {
        const { trip_name, trip_date, stop_count, favorites = [] } = req.body;

        if (!trip_name || typeof trip_name !== "string") {
            return res.status(400).json({ error: "'trip_name' is required" });
        }
        if (!trip_date || typeof trip_date !== "string") {
            return res.status(400).json({ error: "'trip_date' is required" });
        }

        const parsedStopCount = Number(stop_count);
        if (!Number.isInteger(parsedStopCount) || parsedStopCount < 1 || parsedStopCount > 20) {
            return res.status(400).json({ error: "'stop_count' must be an integer between 1 and 20" });
        }

        if (!Array.isArray(favorites) || favorites.length === 0) {
            return res.status(400).json({ error: "'favorites' must be a non-empty array" });
        }

        const db = getDb();
        const uid = req.user.uid;
        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};

        const result = await fetchTripPlan(uid, {
            trip_name: trip_name.trim(),
            trip_date,
            stop_count: parsedStopCount,
            favorites,
            profile_interests: Array.isArray(userData?.interests) ? userData.interests : [],
            behavior_queue: Array.isArray(userData?.behaviorQueue) ? userData.behaviorQueue : [],
        });

        return res.json(result);
    } catch (err) {
        console.error("[trips/plan]", err);
        return res.status(500).json({ error: "Failed to generate trip plan" });
    }
});

// ─── Get cultural info for a place ─────────────────────────────────────────
// POST /api/users/trips/culture
// Body: { place_name }
router.post("/trips/culture", requireAuth, async (req, res) => {
    try {
        const { place_name } = req.body;
        if (!place_name || typeof place_name !== "string") {
            return res.status(400).json({ error: "'place_name' is required" });
        }

        const uid = req.user.uid;
        const result = await fetchCulture(uid, place_name);
        return res.json(result);
    } catch (err) {
        console.error("[trips/culture]", err);
        return res.status(500).json({ error: err.message || "Failed to fetch cultural info" });
    }
});

export default router;