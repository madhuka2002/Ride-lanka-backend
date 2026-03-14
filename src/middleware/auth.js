import { admin } from "../services/firebase.js";

/**
 * Middleware: verify Firebase ID token sent as "Authorization: Bearer <token>"
 */
export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = authHeader.slice(7);
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = decoded; // { uid, email, ... }
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}