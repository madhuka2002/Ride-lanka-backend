import express from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const DEFAULT_SETTINGS = {
    flags: {
        aiPlannerV2: true,
        realtimeWeather: false,
        communityEvents: true,
        maintenanceMode: false,
    },
    apiKeys: {
        // Public/Safe keys if any
    },
    updatedAt: new Date().toISOString()
};

// GET /api/settings
router.get("/", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const settingsDoc = await db.collection("system").doc("settings").get();
        
        if (!settingsDoc.exists) {
            return res.json(DEFAULT_SETTINGS);
        }
        
        res.json({ ...DEFAULT_SETTINGS, ...settingsDoc.data() });
    } catch (err) {
        console.error("[settings] GET failed:", err);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

// PUT /api/settings (Admin only, dev-admin-token or specific admin UID)
router.put("/", requireAuth, async (req, res) => {
    try {
        if (req.user.uid !== "ride-lanka-admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const db = getDb();
        const updates = req.body;
        
        await db.collection("system").doc("settings").set({
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        res.json({ success: true });
    } catch (err) {
        console.error("[settings] PUT failed:", err);
        res.status(500).json({ error: "Failed to update settings" });
    }
});

export default router;
