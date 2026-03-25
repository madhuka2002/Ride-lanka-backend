import { Router } from "express";
import { getDb } from "../services/firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/settings
// Fetch global system configuration
router.get("/", requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const doc = await db.collection("system_config").doc("main").get();
        
        if (!doc.exists) {
            // Default initial settings
            const defaults = {
                flags: {
                    aiPlannerV2: true,
                    realtimeWeather: false,
                    communityEvents: true,
                    maintenanceMode: false,
                },
                apiKeys: {
                    googleMaps: "AIzaSyD...xR4",
                    openWeather: "bd8c72...f1a",
                    geminiAi: "A3b9x2...k9p",
                },
                updatedAt: new Date().toISOString()
            };
            return res.json(defaults);
        }
        
        return res.json(doc.data());
    } catch (err) {
        console.error("[settings GET]", err);
        return res.status(500).json({ error: "Failed to fetch system settings" });
    }
});

// PUT /api/settings
// Update global system configuration (Admin only)
router.put("/", requireAuth, async (req, res) => {
    try {
        // Simple admin check based on email (as per placeholder logic)
        if (req.user.email !== "admin@gmail.com") {
            return res.status(403).json({ error: "Forbidden: Admin access required" });
        }

        const { flags, apiKeys } = req.body;
        const db = getDb();
        
        const updateData = {
            updatedAt: new Date().toISOString(),
        };
        if (flags) updateData.flags = flags;
        if (apiKeys) updateData.apiKeys = apiKeys;

        await db.collection("system_config").doc("main").set(updateData, { merge: true });
        
        return res.json({ success: true, updatedSettings: updateData });
    } catch (err) {
        console.error("[settings PUT]", err);
        return res.status(500).json({ error: "Failed to update system settings" });
    }
});

export default router;
