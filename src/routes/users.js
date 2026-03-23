import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchRecommendations, fetchTripPlan, fetchCulture, searchPlaceAI, fetchReorder } from "../services/aiService.js";

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
        
        const data = snap.data();
        if (data.xp === undefined) data.xp = 0;
        if (!data.badges) data.badges = [];
        
        return res.json(data);
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
// Body: { trip_name, trip_date, stop_count, favorites, route_preference }
router.post("/trips/plan", requireAuth, async (req, res) => {
    try {
        const { trip_name, trip_date, stop_count, favorites = [], route_preference = "shortest" } = req.body;

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
            route_preference,
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

// ─── Save a newly generated trip ──────────────────────────────────────────
// POST /api/users/trips
// Body: { trip_name: string, trip_date: string, stop_count: number, favorites: string[], stops: object[] }
router.post("/trips", requireAuth, async (req, res) => {
    try {
        const { trip_name, trip_date, stop_count, favorites, stops } = req.body;
        if (!trip_name || !trip_date || !stops) {
            return res.status(400).json({ error: "Missing required trip fields" });
        }

        const db = getDb();
        const uid = req.user.uid;
        
        const newTrip = {
            trip_name,
            trip_date,
            stop_count: Number(stop_count) || 0,
            favorites: favorites || [],
            stops,
            status: "Upcoming",
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("users").doc(uid).collection("trips").add(newTrip);
        return res.json({ success: true, tripId: docRef.id });
    } catch (err) {
        console.error("[trips/save]", err);
        return res.status(500).json({ error: "Failed to save trip" });
    }
});

// ─── Update an existing trip (Active/Completed status & Memories) ─────────
// PUT /api/users/trips/:tripId
// Body: { status?: string, stops?: object[] }
router.put("/trips/:tripId", requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;
        const updates = req.body;
        
        if (!tripId || !updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "Missing tripId or update data" });
        }

        const db = getDb();
        const uid = req.user.uid;
        const tripRef = db.collection("users").doc(uid).collection("trips").doc(tripId);
        
        const doc = await tripRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: "Trip not found" });
        }

        updates.updatedAt = new Date().toISOString();
        
        await tripRef.set(updates, { merge: true });
        
        return res.json({ success: true, tripId });
    } catch (err) {
        console.error("[trips/update]", err);
        return res.status(500).json({ error: "Failed to update trip" });
    }
});

// ─── Get all saved trips for user ─────────────────────────────────────────
// GET /api/users/trips
router.get("/trips", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const uid = req.user.uid;
        
        const snap = await db.collection("users").doc(uid).collection("trips").orderBy("createdAt", "desc").get();
        const trips = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return res.json({ trips });
    } catch (err) {
        console.error("[trips GET]", err);
        return res.status(500).json({ error: "Failed to fetch trips" });
    }
});

// ─── Reorder an array of stops based on algorithm ─────────────────────────
// POST /api/users/trips/reorder
// Body: { stops: array, route_preference: string }
router.post("/trips/reorder", requireAuth, async (req, res) => {
    try {
        const { stops, route_preference } = req.body;
        if (!Array.isArray(stops)) return res.status(400).json({ error: "'stops' array required" });
        const uid = req.user.uid;
        const result = await fetchReorder(uid, stops, route_preference);
        return res.json(result);
    } catch (err) {
        console.error("[trips/reorder]", err);
        return res.status(500).json({ error: "Failed to reorder stops" });
    }
});

// ─── Search for a generic place to append to route ────────────────────────
// POST /api/users/trips/search-place
// Body: { query: string }
router.post("/trips/search-place", requireAuth, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "'query' is required" });
        }

        const uid = req.user.uid;
        const result = await searchPlaceAI(uid, query);
        return res.json(result);
    } catch (err) {
        console.error("[trips/search-place]", err);
        return res.status(500).json({ error: err.message || "Failed to search place" });
    }
});

export default router;