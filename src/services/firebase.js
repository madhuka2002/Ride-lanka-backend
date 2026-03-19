import admin from "firebase-admin";

let db;

function parseServiceAccountFromEnv() {
    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const b64Json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;

    if (inlineJson) {
        try {
            return JSON.parse(inlineJson);
        } catch {
            // Ignore malformed JSON and fall back to other formats.
        }
    }

    if (b64Json) {
        try {
            const decoded = Buffer.from(b64Json, "base64").toString("utf8");
            return JSON.parse(decoded);
        } catch {
            // Ignore malformed base64 and fall back to explicit FIREBASE_* fields.
        }
    }

    return null;
}

export function initFirebase() {
    if (admin.apps.length > 0) return;

    const rawServiceAccount = parseServiceAccountFromEnv();
    const serviceAccount = rawServiceAccount ?
        {
            projectId: rawServiceAccount.project_id || rawServiceAccount.projectId,
            clientEmail: rawServiceAccount.client_email || rawServiceAccount.clientEmail,
            privateKey: (rawServiceAccount.private_key || rawServiceAccount.privateKey || "").replace(/\\n/g, "\n"),
        } :
        null;

    const credential = serviceAccount || {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };

    admin.initializeApp({
        credential: admin.credential.cert(credential),
    });

    db = admin.firestore();
    console.log("[firebase] Firestore initialized");
}

export function getDb() {
    if (!db) throw new Error("Firestore not initialized - call initFirebase() first");
    return db;
}

export { admin };