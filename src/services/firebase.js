import admin from "firebase-admin";

let db;

export function initFirebase() {
    if (admin.apps.length > 0) return;

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // The env variable stores \n as literal \\n — replace back
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
    });

    db = admin.firestore();
    console.log("[firebase] Firestore initialized");
}

export function getDb() {
    if (!db) throw new Error("Firestore not initialized — call initFirebase() first");
    return db;
}

export { admin };