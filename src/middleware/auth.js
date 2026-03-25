import { admin } from "../services/firebase.js";

/**
 * Middleware: verify Firebase ID token sent as "Authorization: Bearer <token>"
 */
export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    console.log("[requireAuth] Header present:", !!authHeader, "Path:", req.path);
    if (!authHeader.startsWith("Bearer ")) {
        console.warn("[requireAuth] Missing Bearer token");
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = authHeader.slice(7);

    // Support demo admin session
    if (idToken === "dev-admin-token") {
        req.user = { uid: "ride-lanka-admin", email: "admin@gmail.com" };
        return next();
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded; // { uid, email, ... }
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}