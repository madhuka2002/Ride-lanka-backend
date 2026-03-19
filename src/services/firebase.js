import admin from "firebase-admin";

let db;

export function initFirebase() {
    if (admin.apps.length > 0) return;

    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const rawServiceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;

    if (!rawServiceAccount && !rawServiceAccountB64) {
        throw new Error(
            "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_KEY_B64 (recommended) or FIREBASE_SERVICE_ACCOUNT_KEY (single-line JSON)."
        );
    }

    let serviceAccount;

    if (rawServiceAccountB64) {
        const decoded = Buffer.from(rawServiceAccountB64, "base64").toString("utf8");
        serviceAccount = JSON.parse(decoded);
    } else {
        // Handle possible wrapping quotes from .env and parse JSON.
        // With multi-line .env values, dotenv can leave stray quotes/newlines around the value.
        let normalized = rawServiceAccount.trim();
        if (normalized.startsWith("'") || normalized.startsWith('"')) normalized = normalized.slice(1);
        if (normalized.endsWith("'") || normalized.endsWith('"')) normalized = normalized.slice(0, -1);

        try {
            serviceAccount = JSON.parse(normalized);
        } catch (e) {
            // If dotenv parsing leaves extra characters, recover by slicing the JSON object.
            const start = normalized.indexOf("{");
            const end = normalized.lastIndexOf("}");
            if (start !== -1 && end !== -1 && end > start) {
                serviceAccount = JSON.parse(normalized.slice(start, end + 1));
            } else {
                throw e;
            }
        }
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log("[firebase] Firestore initialized");
}

export function getDb() {
    if (!db) throw new Error("Firestore not initialized — call initFirebase() first");
    return db;
}

export { admin };