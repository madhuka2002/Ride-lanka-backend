import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebase } from "./services/firebase.js";
import userRoutes from "./routes/users.js";
import eventRoutes from "./routes/events.js";
import questRoutes from "./routes/quests.js";
import exploreRoutes from "./routes/explore.js";
import settingsRoutes from "./routes/settings.js";

initFirebase();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "Ride Lanka Backend" }));

app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/settings", settingsRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[backend] Running on http://localhost:${PORT}`));